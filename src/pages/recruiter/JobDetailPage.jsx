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
import { JobWorkflowTab } from '@/components/recruiter/jobs/JobWorkflowTab';
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
import { getResumeStatusRequest } from '@/api/jobApi';
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
const MATCH_FOLLOWUP_MS = 5000;

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
  const stopPollRef = useRef(null);
  const pageRef = useRef(page);
  pageRef.current = page;

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
   * Poll lightweight resume status every 2s.
   * When parse batch is done → refresh candidate list once (+ one delayed refresh for AI match scores).
   */
  const watchResumeParse = useCallback((resumeFileIds, fileName) => {
    stopPolling();

    const ids = Array.isArray(resumeFileIds) ? resumeFileIds.filter(Boolean) : [];
    if (!ids.length) {
      loadCandidates();
      return;
    }

    const startedAt = Date.now();
    let inFlight = false;
    let finished = false;

    setParseProgress({
      active: true,
      phase: 'parsing',
      fileName,
      percent: 15,
      completed: 0,
      failed: 0,
      total: ids.length,
      message: `Parsing ${fileName || 'resume'}…`,
    });

    const finish = async (status) => {
      if (finished) return;
      finished = true;
      stopPolling();

      const failedAll = status.failed > 0 && status.completed === 0;
      setParseProgress({
        active: false,
        phase: failedAll ? 'failed' : 'done',
        fileName,
        percent: 100,
        completed: status.completed,
        failed: status.failed,
        total: status.total,
        message: failedAll
          ? 'Resume parsing failed'
          : status.failed
            ? `Parsed with ${status.failed} failure(s) — updating list`
            : 'Parsing complete — updating candidate list',
      });

      await loadCandidates();

      if (failedAll) {
        toast.error('Resume parsing failed');
      } else if (status.failed) {
        toast.warning(`Parsed ${status.completed}, ${status.failed} failed`);
      } else {
        toast.success('Parsing complete — candidate list updated');
      }

      // AI_MATCH runs after parse; one follow-up list refresh for scores (not a poll loop)
      setTimeout(() => {
        loadCandidates();
        setParseProgress(null);
      }, MATCH_FOLLOWUP_MS);
    };

    const tick = async () => {
      if (finished || inFlight) return;
      inFlight = true;
      try {
        if (Date.now() - startedAt >= STATUS_POLL_MAX_MS) {
          await finish({ completed: 0, failed: 0, total: ids.length });
          toast.message('Parsing is taking longer than expected — list refreshed anyway');
          return;
        }

        const { data } = await getResumeStatusRequest(jobId, ids);
        const status = data.data;

        setParseProgress((prev) => ({
          ...(prev || {}),
          active: true,
          phase: 'parsing',
          fileName,
          percent: status.percent ?? 15,
          completed: status.completed ?? 0,
          failed: status.failed ?? 0,
          total: status.total ?? ids.length,
          message: `Parsing… ${status.completed + status.failed}/${status.total} finished`,
        }));

        if (status.done) {
          await finish(status);
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
    dispatch(fetchJob(jobId));
    dispatch(fetchDashboardStats({ jobId }));
    return () => {
      stopPolling();
      dispatch(clearCurrentJob());
      dispatch(clearCandidates());
    };
  }, [dispatch, jobId, stopPolling]);

  useEffect(() => {
    if (tab === 'candidates') loadCandidates();
  }, [tab, loadCandidates]);

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
    const resumeFileIds = [];
    let reused = 0;
    let failed = 0;

    for (const file of files) {
      const result = await dispatch(uploadResume({ jobId, file }));
      if (!uploadResume.fulfilled.match(result)) {
        failed += 1;
        continue;
      }
      if (result.payload?.reused) {
        reused += 1;
        continue;
      }
      if (result.payload?.resumeFileId) {
        resumeFileIds.push(result.payload.resumeFileId);
      }
    }

    if (failed && !resumeFileIds.length && !reused) {
      toast.error(files.length > 1 ? 'All uploads failed' : 'Upload failed');
      return;
    }
    if (failed) toast.warning(`${failed} file(s) failed to upload`);
    if (reused) toast.success(`${reused} resume(s) already on file — linked to this job`);

    if (resumeFileIds.length) {
      toast.message(
        resumeFileIds.length > 1
          ? `Upload complete — parsing ${resumeFileIds.length} files`
          : 'Upload complete — parsing started'
      );
      watchResumeParse(resumeFileIds, files[0]?.name);
    } else {
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
                <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                  <p className="text-xs text-muted">
                    List updates once parsing finishes (match scores may land a few seconds later)
                  </p>
                  <Button variant="outline" size="sm" onClick={loadCandidates} disabled={loading}>
                    Refresh list
                  </Button>
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

        {(tab === 'outreach' || tab === 'interviews' || tab === 'decisions') && (
          <JobWorkflowTab jobId={jobId} type={tab} />
        )}
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