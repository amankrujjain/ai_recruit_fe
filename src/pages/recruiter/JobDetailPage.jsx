import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { JobDetailHeader } from '@/components/recruiter/jobs/JobDetailHeader';
import { JobOverviewTab } from '@/components/recruiter/jobs/JobOverviewTab';
import { OutreachTab } from '@/components/recruiter/jobs/OutreachTab';
import { InterviewsTab } from '@/components/recruiter/jobs/InterviewsTab';
import { DecisionsTab } from '@/components/recruiter/jobs/DecisionsTab';
import { FileUploadZone } from '@/components/recruiter/candidates/FileUploadZone';
import { CandidateTable } from '@/components/recruiter/candidates/CandidateTable';
import { CandidatesEligibilityBar } from '@/components/recruiter/candidates/CandidatesEligibilityBar';
import { CandidatesToolbar } from '@/components/recruiter/candidates/CandidatesToolbar';
import { CandidatesSelectionBar } from '@/components/recruiter/candidates/CandidatesSelectionBar';
import { ResumeProcessingBanner } from '@/components/recruiter/candidates/ResumeProcessingBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { RankingMode } from '@/lib/rankingMode';
import {
  countEligible,
  DEFAULT_ELIGIBILITY_THRESHOLD,
  isCandidateEligible,
  isCandidateSelectable,
} from '@/lib/candidateEligibility';
import { getResumeStatusRequest, rescoreCandidateRequest, rescoreJobCandidatesRequest } from '@/api/jobApi';
import {
  fetchJob,
  closeJob,
  activateJob,
  selectJobs,
  clearCurrentJob,
} from '@/store/slices/jobsSlice';
import {
  fetchCandidates,
  uploadResume,
  selectCandidates,
  deleteCandidate,
  clearCandidates,
  selectCandidatesState,
} from '@/store/slices/candidatesSlice';
import {
  fetchDashboardStats,
  selectRecruitment,
} from '@/store/slices/recruitmentSlice';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'outreach', label: 'Outreach' },
  { id: 'interviews', label: 'Interviews' },
  { id: 'decisions', label: 'Decisions' },
];

const STATUS_POLL_MS = 2000;
const STATUS_POLL_MAX_MS = 120000;
const MATCH_POLL_MAX_MS = 120000;

const failedFilesFromStatus = (status) =>
  (status?.files || [])
    .filter((f) => f.processingStatus === 'FAILED' || f.failureReason || f.failureCode)
    .map((f) => ({
      resumeFileId: f.resumeFileId,
      fileName: f.fileName,
      failureCode: f.failureCode,
      failureReason: f.failureReason,
    }));

const collectResumeFileIds = (payload = {}) => {
  const ids = [
    ...(Array.isArray(payload.resumeFileIds) ? payload.resumeFileIds : []),
    ...(payload.resumeFileId ? [payload.resumeFileId] : []),
  ];
  return ids.filter(Boolean);
};

const isMatchingComplete = (status) => {
  if (!status?.done) return false;
  if ((status.matchingPending ?? 0) > 0) return false;
  const files = status.files || [];
  const awaitingScore = files.some((file) => (
    file.processingStatus === 'COMPLETED'
    && file.candidateId
    && file.overallMatch == null
    && !file.matchingDone
  ));
  if (awaitingScore) return false;
  if ((status.completed ?? 0) > 0 && (status.matched ?? 0) === 0 && files.length === 0) {
    return Boolean(status.matchingDone);
  }
  return status.matchingDone !== false;
};

export function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const dispatch = useDispatch();
  const { current: job, detailLoading, saving } = useSelector(selectJobs);
  usePageTitle(job?.jobTitle || 'Job');
  const {
    items,
    pagination,
    eligibleCount: serverEligibleCount,
    loading,
    uploading,
    selecting,
    deletingId,
  } = useSelector(selectCandidatesState);
  const { stats } = useSelector(selectRecruitment);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [eligibilityThreshold, setEligibilityThreshold] = useState(DEFAULT_ELIGIBILITY_THRESHOLD);
  const [parseProgress, setParseProgress] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [invitingId, setInvitingId] = useState(null);
  const [rescoringId, setRescoringId] = useState(null);
  const [bulkRescoring, setBulkRescoring] = useState(false);
  const stopPollRef = useRef(null);
  const watchedIdsRef = useRef([]);
  const itemsRef = useRef(items);
  const parseProgressRef = useRef(parseProgress);
  const pageRef = useRef(page);
  pageRef.current = page;
  itemsRef.current = items;
  parseProgressRef.current = parseProgress;

  const loadCandidates = useCallback(() => {
    return dispatch(fetchCandidates({
      jobId,
      page: pageRef.current,
      sortBy: 'overallMatch',
      eligibilityThreshold,
    }));
  }, [dispatch, jobId, eligibilityThreshold]);

  const stopPolling = useCallback(() => {
    if (stopPollRef.current) {
      stopPollRef.current();
      stopPollRef.current = null;
    }
  }, []);

  /**
   * Phase 1: poll resume parse status.
   * Phase 2: after parse done, poll until AI match scores ready (or timeout).
   */
  const watchResumeParse = useCallback((resumeFileIds, fileName) => {
    stopPolling();

    const incoming = Array.isArray(resumeFileIds) ? resumeFileIds.filter(Boolean) : [];
    const ids = [...new Set([...watchedIdsRef.current, ...incoming])];
    watchedIdsRef.current = ids;
    if (!ids.length) {
      loadCandidates();
      return;
    }

    const startedAt = Date.now();
    let scoringStartedAt = null;
    let inFlight = false;
    let finished = false;
    let phase = 'parsing';

    setParseProgress({
      active: true,
      phase: 'parsing',
      fileName,
      percent: 15,
      completed: 0,
      failed: 0,
      matched: 0,
      total: ids.length,
      failedFiles: [],
      message: `Parsing ${fileName || 'resume'}…`,
    });

    const clearBannerSoon = () => {
      setTimeout(() => setParseProgress(null), 1500);
    };

    const finishAllFailed = (status) => {
      finished = true;
      watchedIdsRef.current = [];
      stopPolling();
      setParseProgress({
        active: false,
        phase: 'failed',
        fileName,
        percent: 100,
        completed: status.completed ?? 0,
        failed: status.failed ?? 0,
        matched: 0,
        total: status.total ?? ids.length,
        failedFiles: failedFilesFromStatus(status),
        message: 'Resume parsing failed',
      });
      toast.error('Resume parsing failed');
      clearBannerSoon();
    };

    const finishScoring = async (status, { timedOut = false } = {}) => {
      if (finished) return;
      finished = true;
      watchedIdsRef.current = [];
      stopPolling();

      await loadCandidates();

      setParseProgress({
        active: false,
        phase: 'done',
        fileName,
        percent: 100,
        completed: status.completed ?? 0,
        failed: status.failed ?? 0,
        matched: status.matched ?? 0,
        total: status.total ?? ids.length,
        failedFiles: failedFilesFromStatus(status),
        message: timedOut
          ? 'Scoring is taking longer — list refreshed'
          : 'Candidates scored — list updated',
      });

      if (timedOut) {
        toast.message('Scoring is taking longer than expected — list refreshed anyway');
      } else if (status.failed) {
        toast.warning(
          `Scored ${status.matched ?? 0}; ${status.failed} file(s) failed to parse`
        );
      } else {
        toast.success('Scoring complete — candidate list updated');
      }

      clearBannerSoon();
    };

    const enterScoring = async (status) => {
      phase = 'scoring';
      scoringStartedAt = Date.now();
      await loadCandidates();

      if (status.failed && status.completed === 0) {
        finishAllFailed(status);
        return;
      }

      if (status.failed) {
        toast.warning(`Parsed ${status.completed}, ${status.failed} failed`);
      }

      setParseProgress({
        active: true,
        phase: 'scoring',
        fileName,
        percent: 100,
        completed: status.completed ?? 0,
        failed: status.failed ?? 0,
        matched: status.matched ?? 0,
        total: status.total ?? ids.length,
        failedFiles: failedFilesFromStatus(status),
        message: 'Scoring candidates…',
      });

      if (isMatchingComplete(status)) {
        await finishScoring(status);
      }
    };

    const tick = async () => {
      if (finished || inFlight) return;
      inFlight = true;
      try {
        if (phase === 'parsing' && Date.now() - startedAt >= STATUS_POLL_MAX_MS) {
          const { data } = await getResumeStatusRequest(jobId, ids);
          const status = data.data;
          if (status.done) {
            await enterScoring(status);
          } else {
            finished = true;
            watchedIdsRef.current = [];
            stopPolling();
            await loadCandidates();
            toast.message('Parsing is taking longer than expected — list refreshed anyway');
            setParseProgress(null);
          }
          return;
        }

        if (phase === 'scoring' && scoringStartedAt
          && Date.now() - scoringStartedAt >= MATCH_POLL_MAX_MS) {
          const { data } = await getResumeStatusRequest(jobId, ids);
          await finishScoring(data.data, { timedOut: true });
          return;
        }

        const { data } = await getResumeStatusRequest(jobId, ids);
        const status = data?.data;
        if (!status) return;

        if (phase === 'parsing') {
          setParseProgress((prev) => ({
            ...(prev || {}),
            active: true,
            phase: 'parsing',
            fileName,
            percent: status.percent ?? 15,
            completed: status.completed ?? 0,
            failed: status.failed ?? 0,
            matched: status.matched ?? 0,
            total: status.total ?? ids.length,
            failedFiles: failedFilesFromStatus(status),
            message: `Parsing… ${status.completed + status.failed}/${status.total} finished`,
          }));

          // Progressive UX: show candidates as soon as individual parses complete
          if ((status.completed ?? 0) > 0 || (status.matched ?? 0) > 0) {
            await loadCandidates();
          }

          if (status.done) {
            await enterScoring(status);
          }
          return;
        }

        // scoring phase
        setParseProgress((prev) => ({
          ...(prev || {}),
          active: true,
          phase: 'scoring',
          fileName,
          percent: 100,
          completed: status.completed ?? 0,
          failed: status.failed ?? 0,
          matched: status.matched ?? 0,
          total: status.total ?? ids.length,
          failedFiles: failedFilesFromStatus(status),
          message: 'Scoring candidates…',
        }));

        if (isMatchingComplete(status)) {
          await finishScoring(status);
        }
      } catch {
        // Keep polling on transient errors
      } finally {
        inFlight = false;
      }
    };

    tick();
    const timer = setInterval(tick, STATUS_POLL_MS);
    stopPollRef.current = () => clearInterval(timer);
  }, [jobId, loadCandidates, stopPolling]);

  useEffect(() => {
    watchedIdsRef.current = [];
    dispatch(fetchJob(jobId));
    dispatch(fetchDashboardStats({ jobId }));
    return () => {
      stopPolling();
      watchedIdsRef.current = [];
      dispatch(clearCurrentJob());
      dispatch(clearCandidates());
    };
  }, [dispatch, jobId, stopPolling]);

  useEffect(() => {
    if (tab === 'candidates') loadCandidates();
  }, [tab, loadCandidates]);

  // Keep watching pending scores after refresh / reused upload / abandoned prior poll
  useEffect(() => {
    if (tab !== 'candidates') return undefined;

    let cancelled = false;
    let inFlight = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled || inFlight || parseProgressRef.current?.active) return;
      if (stopPollRef.current) return;
      const pending = itemsRef.current.some(
        (row) => row.overallMatch == null && !row.matchDetails?.failure
      );
      if (!pending) return;
      if (Date.now() - startedAt >= MATCH_POLL_MAX_MS) return;
      inFlight = true;
      try {
        await loadCandidates();
      } finally {
        inFlight = false;
      }
    };

    const timer = setInterval(tick, STATUS_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [tab, jobId, loadCandidates]);

  const setTab = (id) => setSearchParams({ tab: id });

  const closeConfirm = () => setConfirmDialog(null);

  const handleDeactivate = () => {
    setConfirmDialog({
      type: 'close-job',
      title: 'Close this job?',
      description: 'It will stop accepting new candidates. Existing candidate records will remain available.',
      confirmLabel: 'Close job',
      variant: 'danger',
    });
  };

  const handleDeleteCandidate = (row) => {
    const name = row.candidate?.name || 'this candidate';
    setConfirmDialog({
      type: 'delete-candidate',
      candidateJobId: row.candidateJobId,
      title: 'Remove candidate?',
      description: `Are you sure you want to remove ${name} from this job? This action is not reversible.`,
      confirmLabel: 'Remove',
      variant: 'danger',
    });
  };

  const handleViewInterview = (row) => {
    navigate(`/recruiter/jobs/${jobId}/candidates/${row.candidateJobId}`);
  };

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'close-job') {
      const result = await dispatch(closeJob({ jobId }));
      closeConfirm();
      if (closeJob.fulfilled.match(result)) toast.success('Job deactivated');
      else toast.error(result.payload || 'Failed to close job');
      return;
    }

    if (confirmDialog.type === 'activate') {
  const result = await dispatch(activateJob(jobId));
  closeConfirm();

  if (activateJob.fulfilled.match(result)) {
    toast.success('Job activated');
  } else {
    toast.error(result.payload || 'Failed to activate');
  }

  return;
}

    if (confirmDialog.type === 'delete-candidate') {
      const candidateJobId = confirmDialog.candidateJobId;
      const result = await dispatch(deleteCandidate({ jobId, candidateJobId }));
      closeConfirm();
      if (deleteCandidate.fulfilled.match(result)) {
        toast.success('Candidate removed');
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(candidateJobId);
          return next;
        });
      } else {
        toast.error(result.payload || 'Could not remove candidate');
      }
    }
  };

//   const handleActivate = async () => {
//   if (!window.confirm('Activate this job? It will start accepting new candidates again.')) return;

//   const result = await dispatch(activateJob(jobId));

//   if (activateJob.fulfilled.match(result)) {
//     toast.success('Job activated');
//   } else {
//     toast.error(result.payload || 'Failed to activate');
//   }
// };

const handleActivate = () => {
  setConfirmDialog({
    type: 'activate',
    title: 'Activate this job?',
    description: 'It will start accepting new candidates again.',
    confirmLabel: 'Activate',
    variant: 'default',
  });
};

  // const handleExcel = async (file) => {
  //   const result = await dispatch(uploadExcel({ jobId, file }));
  //   if (uploadExcel.fulfilled.match(result)) {
  //     toast.success(`Excel uploaded — ${result.payload.uploaded || 0} candidate(s)`);
  //     await loadCandidates();
  //     // Matching is async for excel rows — one delayed refresh for scores
  //     setTimeout(() => loadCandidates(), MATCH_FOLLOWUP_MS);
  //   } else toast.error(result.payload || 'Upload failed');
  // };

  const handleResume = async (fileOrFiles) => {
    const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
    const parseResumeFileIds = [];
    let reused = 0;
    let failed = 0;

    for (const file of files) {
      const result = await dispatch(uploadResume({ jobId, file }));
      if (!uploadResume.fulfilled.match(result)) {
        failed += 1;
        continue;
      }
      const isReuse = Boolean(result.payload?.reused);
      if (isReuse) {
        reused += result.payload.reusedCount || 1;
      } else {
        const ids = collectResumeFileIds(result.payload);
        for (const id of ids) {
          if (!parseResumeFileIds.includes(id)) parseResumeFileIds.push(id);
        }
        // Mixed ZIP: some entries reused inside a non-reused envelope
        if (result.payload?.reusedCount) {
          reused += result.payload.reusedCount;
        }
      }
    }

    if (failed && !parseResumeFileIds.length && !reused) {
      toast.error(files.length > 1 ? 'All uploads failed' : 'Upload failed');
      return;
    }
    if (failed) toast.warning(`${failed} file(s) failed to upload`);
    if (reused) toast.success(`${reused} resume(s) already on file — linked to this job`);

    // Reused rows are linked synchronously — refresh list before/without parse poll.
    if (reused) {
      await loadCandidates();
    }

    if (parseResumeFileIds.length) {
      toast.message(
        parseResumeFileIds.length > 1
          ? `Upload complete — parsing ${parseResumeFileIds.length} files`
          : 'Upload complete — parsing started'
      );
      watchResumeParse(parseResumeFileIds, files[0]?.name);
    } else if (!reused) {
      await loadCandidates();
    }
  };

  const toggleSelect = (id) => {
    const row = items.find((item) => item.candidateJobId === id);
    if (row && !isCandidateSelectable(row, eligibilityThreshold)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const eligibleItems = items.filter((row) => isCandidateEligible(row, eligibilityThreshold));
  const eligibleCount = serverEligibleCount ?? countEligible(items, eligibilityThreshold);
  const eligibleIds = eligibleItems.map((row) => row.candidateJobId);
  const selectAllEligibleChecked =
    eligibleIds.length > 0 && eligibleIds.every((id) => selectedIds.has(id));

  useEffect(() => {
    setSelectedIds((prev) => {
      if (!prev.size) return prev;
      const allowed = new Set(
        items
          .filter((row) => isCandidateSelectable(row, eligibilityThreshold))
          .map((row) => row.candidateJobId)
      );
      let changed = false;
      const next = new Set();
      prev.forEach((id) => {
        if (allowed.has(id)) next.add(id);
        else changed = true;
      });
      return changed ? next : prev;
    });
  }, [items, eligibilityThreshold]);

  const toggleSelectAllEligible = (checked) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        eligibleIds.forEach((id) => next.add(id));
      } else {
        eligibleIds.forEach((id) => next.delete(id));
      }
      return next;
    });
  };

  const handleSelectForOutreach = async () => {
    if (!selectedIds.size) {
      toast.error('Select at least one candidate');
      return;
    }
    const result = await dispatch(selectCandidates({
      jobId,
      payload: { mode: RankingMode.MANUAL, candidateJobIds: [...selectedIds] },
    }));
    if (selectCandidates.fulfilled.match(result)) {
      toast.success(`${result.payload.selected} candidate(s) invited — outreach email queued`);
      setSelectedIds(new Set());
      loadCandidates();
      dispatch(fetchDashboardStats({ jobId }));
    } else toast.error(result.payload || 'Invite failed');
  };

  const handleInviteOne = async (row) => {
    setInvitingId(row.candidateJobId);
    const result = await dispatch(selectCandidates({
      jobId,
      payload: { mode: RankingMode.MANUAL, candidateJobIds: [row.candidateJobId] },
    }));
    setInvitingId(null);
    if (selectCandidates.fulfilled.match(result)) {
      toast.success('Invite queued');
      loadCandidates();
      dispatch(fetchDashboardStats({ jobId }));
    } else toast.error(result.payload || 'Invite failed');
  };

  const handleRescore = async (row) => {
    if (!row?.candidateJobId) return;
    setRescoringId(row.candidateJobId);
    try {
      await rescoreCandidateRequest(jobId, row.candidateJobId, { force: true });
      toast.success('Rescore queued');
      await loadCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Rescore failed');
    } finally {
      setRescoringId(null);
    }
  };

  const handleBulkRescoreFailed = async () => {
    setBulkRescoring(true);
    try {
      const { data } = await rescoreJobCandidatesRequest(jobId, { scope: 'failed', force: true });
      const enqueued = data?.data?.enqueued ?? 0;
      toast.success(enqueued ? `Rescore queued for ${enqueued} candidate(s)` : 'No failed scores to retry');
      await loadCandidates();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Bulk rescore failed');
    } finally {
      setBulkRescoring(false);
    }
  };

  const failedScoreCount = items.filter((row) => row.matchDetails?.failure).length;

  const busy = uploading || Boolean(parseProgress?.active);

  if (detailLoading && !job) {
    return <PageContentSkeleton />;
  }

  if (!job) {
    return (
      <div>
        <p className="text-sm text-muted">Job not found.</p>
        <Button asChild className="mt-4">
          <Link to="/recruiter/jobs">Back to jobs</Link>
        </Button>
      </div>
    );
  }

return (
  <>
    <div className="mx-auto w-full max-w-8xl space-y-6">
        <JobDetailHeader
          job={job}
          candidateCount={stats?.totalCandidates}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          deactivating={saving}
        />

        <div className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors',
                tab === id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-muted hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <JobOverviewTab job={job} stats={stats} />
        )}

        {tab === 'candidates' && (
          <div className="space-y-5">
            <FileUploadZone
              type="resume"
              onUpload={handleResume}
              uploading={busy}
            />

            <ResumeProcessingBanner progress={parseProgress} />

            <CandidatesEligibilityBar
              threshold={eligibilityThreshold}
              onThresholdChange={setEligibilityThreshold}
              eligibleCount={eligibleCount}
              totalCount={pagination?.total ?? items.length}
            />

            <CandidatesToolbar
              selectAllEligibleChecked={selectAllEligibleChecked}
              onToggleSelectAllEligible={toggleSelectAllEligible}
              eligibleCount={eligibleCount}
            />

            <Card className="rounded-xl border-border shadow-none">
              <CardContent className="p-0 pt-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <p className="text-xs text-muted">
                    Candidates appear as parsing finishes. Scores fill in moments later.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {failedScoreCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBulkRescoreFailed}
                        disabled={bulkRescoring || loading}
                        title="Retry scoring for failed rows"
                      >
                        {bulkRescoring ? 'Rescoring…' : `Rescore failed (${failedScoreCount})`}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadCandidates}
                      disabled={loading}
                      title="Refresh candidate list"
                    >
                      Refresh list
                    </Button>
                  </div>
                </div>
                <div className="px-1 pb-2">
                  <CandidateTable
                    items={items}
                    loading={loading}
                    selectedIds={selectedIds}
                    deletingId={deletingId}
                    threshold={eligibilityThreshold}
                    onToggle={toggleSelect}
                    onDelete={handleDeleteCandidate}
                    onViewInterview={handleViewInterview}
                    onInviteOne={handleInviteOne}
                    onRefreshRow={loadCandidates}
                    onRescore={handleRescore}
                    rescoringId={rescoringId}
                    invitingId={invitingId}
                  />
                </div>
                <div className="border-t border-border px-4 py-3">
                  <PaginationBar pagination={pagination} onPageChange={setPage} />
                </div>
              </CardContent>
            </Card>

            <CandidatesSelectionBar
              selectedCount={selectedIds.size}
              onClear={() => setSelectedIds(new Set())}
              onInvite={handleSelectForOutreach}
              inviting={selecting && !invitingId}
            />
          </div>
        )}

        {tab === 'outreach' && <OutreachTab jobId={jobId} />}
        {tab === 'interviews' && <InterviewsTab jobId={jobId} />}
        {tab === 'decisions' && <DecisionsTab jobId={jobId} />}
      </div>

      <ConfirmDialog
        open={Boolean(confirmDialog)}
        title={confirmDialog?.title}
        description={confirmDialog?.description}
        confirmLabel={confirmDialog?.confirmLabel}
        cancelLabel="Cancel"
        variant={confirmDialog?.variant || 'default'}
        loading={Boolean(deletingId) || saving}
        onOpenChange={(open) => { if (!open) closeConfirm(); }}
        onConfirm={handleConfirm}
      />
    </>
  );
}