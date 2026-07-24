import { useEffect, useState, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { JobDetailHeader } from '@/components/recruiter/jobs/JobDetailHeader';
import { FileUploadZone } from '@/components/recruiter/candidates/FileUploadZone';
import { CandidateTable } from '@/components/recruiter/candidates/CandidateTable';
import { SelectCandidatesBar } from '@/components/recruiter/candidates/SelectCandidatesBar';
import { ResumeProcessingBanner } from '@/components/recruiter/candidates/ResumeProcessingBanner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { cn } from '@/lib/utils';
import { RankingMode } from '@/lib/rankingMode';
import { getResumeStatusRequest } from '@/api/jobApi';
import {
  fetchJob,
  deactivateJob,
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

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'candidates', label: 'Candidates' },
];

const STATUS_POLL_MS = 2000;
const STATUS_POLL_MAX_MS = 120000;
const MATCH_FOLLOWUP_MS = 5000;

export function JobDetailPage() {
  const { jobId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const dispatch = useDispatch();
  const { current: job, detailLoading, saving } = useSelector(selectJobs);
  const { items, pagination, loading, uploading, selecting, deletingId } = useSelector(selectCandidatesState);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [parseProgress, setParseProgress] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const stopPollRef = useRef(null);
  const pageRef = useRef(page);
  pageRef.current = page;

  const loadCandidates = useCallback(() => {
    return dispatch(fetchCandidates({ jobId, page: pageRef.current, sortBy: 'overallMatch' }));
  }, [dispatch, jobId]);

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
      type: 'deactivate',
      title: 'Deactivate this job?',
      description: 'It will no longer accept new candidates. You can still view existing ones.',
      confirmLabel: 'Deactivate',
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

  const handleConfirm = async () => {
    if (!confirmDialog) return;

    if (confirmDialog.type === 'deactivate') {
      const result = await dispatch(deactivateJob(jobId));
      closeConfirm();
      if (deactivateJob.fulfilled.match(result)) toast.success('Job deactivated');
      else toast.error(result.payload || 'Failed to deactivate');
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

  const handleActivate = async () => {
  if (!window.confirm('Activate this job? It will start accepting new candidates again.')) return;

  const result = await dispatch(activateJob(jobId));

  if (activateJob.fulfilled.match(result)) {
    toast.success('Job activated');
  } else {
    toast.error(result.payload || 'Failed to activate');
  }
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

  const handleResume = async (file) => {
    const result = await dispatch(uploadResume({ jobId, file }));
    if (!uploadResume.fulfilled.match(result)) {
      toast.error(result.payload || 'Upload failed');
      return;
    }

    if (result.payload?.reused) {
      toast.success('Resume already on file — linked to this job');
      await loadCandidates();
      return;
    }

    if (result.payload?.resumeFileId) {
      toast.message('Upload complete — parsing started');
      watchResumeParse([result.payload.resumeFileId], file.name);
    } else {
      await loadCandidates();
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked) => {
    setSelectedIds(checked ? new Set(items.map((c) => c.candidateJobId)) : new Set());
  };

  const handleSelectForOutreach = async () => {
    const result = await dispatch(selectCandidates({
      jobId,
      payload: { mode: RankingMode.MANUAL, candidateJobIds: [...selectedIds] },
    }));
    if (selectCandidates.fulfilled.match(result)) {
      toast.success(`${result.payload.selected} candidate(s) selected — outreach email queued`);
      setSelectedIds(new Set());
      loadCandidates();
    } else toast.error(result.payload || 'Selection failed');
  };

  const busy = uploading || Boolean(parseProgress?.active);

  if (detailLoading && !job) {
    return (
      <DashboardShell title="Job">
        <p className="text-sm text-muted">Loading job…</p>
      </DashboardShell>
    );
  }

  if (!job) {
    return (
      <DashboardShell title="Job">
        <p className="text-sm text-muted">Job not found.</p>
        <Button asChild className="mt-4">
          <Link to="/recruiter/jobs">Back to jobs</Link>
        </Button>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={job.jobTitle}>
      <div className="mx-auto max-w-6xl space-y-6">
        <JobDetailHeader
  job={job}
  onDeactivate={handleDeactivate}
  onActivate={handleActivate}
  deactivating={saving}
/>

        <div className="flex gap-2 border-b border-border">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
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
          <Card>
            <CardContent className="space-y-4 pt-6">
              <p className="whitespace-pre-wrap text-sm text-foreground">{job.jobDescription}</p>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <p><span className="text-muted">Experience:</span> {job.experienceMin}–{job.experienceMax} years</p>
                <p><span className="text-muted">Skills:</span> {(job.mandatorySkills || []).join(', ')}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTab('candidates')}>
                Manage candidates
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'candidates' && (
          <div className="space-y-6">
            {/* <div className="grid gap-4 lg:grid-cols-2">
              <FileUploadZone type="excel" onUpload={handleExcel} uploading={busy} />
              <FileUploadZone type="resume" onUpload={handleResume} uploading={busy} />
            </div> */}

            <div className="grid gap-4">
  <FileUploadZone
    type="resume"
    onUpload={handleResume}
    uploading={busy}
  />
</div>

            <ResumeProcessingBanner progress={parseProgress} />

            <SelectCandidatesBar
              selectedCount={selectedIds.size}
              selecting={selecting}
              onSelect={handleSelectForOutreach}
            />
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-muted">
                    List updates once parsing finishes (match scores may land a few seconds later)
                  </p>
                  <Button variant="outline" size="sm" onClick={loadCandidates} disabled={loading}>
                    Refresh list
                  </Button>
                </div>
                <CandidateTable
                  items={items}
                  loading={loading}
                  selectedIds={selectedIds}
                  deletingId={deletingId}
                  onToggle={toggleSelect}
                  onToggleAll={toggleAll}
                  onDelete={handleDeleteCandidate}
                />
                <PaginationBar pagination={pagination} onPageChange={setPage} />
              </CardContent>
            </Card>
          </div>
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
    </DashboardShell>
  );
}
