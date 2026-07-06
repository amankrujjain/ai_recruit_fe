import { useEffect, useState, useCallback } from 'react';
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
import { cn } from '@/lib/utils';
import { RankingMode } from '@/lib/rankingMode';
import {
  fetchJob,
  deactivateJob,
  selectJobs,
  clearCurrentJob,
} from '@/store/slices/jobsSlice';
import {
  fetchCandidates,
  uploadExcel,
  uploadResume,
  selectCandidates,
  clearCandidates,
  selectCandidatesState,
} from '@/store/slices/candidatesSlice';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'candidates', label: 'Candidates' },
];

export function JobDetailPage() {
  const { jobId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'overview';
  const dispatch = useDispatch();
  const { current: job, detailLoading, saving } = useSelector(selectJobs);
  const { items, pagination, loading, uploading, selecting } = useSelector(selectCandidatesState);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const loadCandidates = useCallback(() => {
    dispatch(fetchCandidates({ jobId, page, sortBy: 'overallMatch' }));
  }, [dispatch, jobId, page]);

  useEffect(() => {
    dispatch(fetchJob(jobId));
    return () => {
      dispatch(clearCurrentJob());
      dispatch(clearCandidates());
    };
  }, [dispatch, jobId]);

  useEffect(() => {
    if (tab === 'candidates') loadCandidates();
  }, [tab, loadCandidates]);

  const setTab = (id) => setSearchParams({ tab: id });

  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate this job? It will no longer accept new candidates.')) return;
    const result = await dispatch(deactivateJob(jobId));
    if (deactivateJob.fulfilled.match(result)) toast.success('Job deactivated');
    else toast.error(result.payload || 'Failed to deactivate');
  };

  const handleExcel = async (file) => {
    const result = await dispatch(uploadExcel({ jobId, file }));
    if (uploadExcel.fulfilled.match(result)) {
      toast.success('Excel uploaded — AI matching in progress');
      loadCandidates();
    } else toast.error(result.payload || 'Upload failed');
  };

  const handleResume = async (file) => {
    const result = await dispatch(uploadResume({ jobId, file }));
    if (uploadResume.fulfilled.match(result)) {
      toast.success('Resume uploaded — parsing in progress');
      loadCandidates();
    } else toast.error(result.payload || 'Upload failed');
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
        <JobDetailHeader job={job} onDeactivate={handleDeactivate} deactivating={saving} />

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
            <div className="grid gap-4 lg:grid-cols-2">
              <FileUploadZone type="excel" onUpload={handleExcel} uploading={uploading} />
              <FileUploadZone type="resume" onUpload={handleResume} uploading={uploading} />
            </div>
            <SelectCandidatesBar
              selectedCount={selectedIds.size}
              selecting={selecting}
              onSelect={handleSelectForOutreach}
            />
            <Card>
              <CardContent className="pt-6">
                <div className="mb-4 flex justify-end">
                  <Button variant="outline" size="sm" onClick={loadCandidates} disabled={loading}>
                    Refresh list
                  </Button>
                </div>
                <CandidateTable
                  items={items}
                  loading={loading}
                  selectedIds={selectedIds}
                  onToggle={toggleSelect}
                  onToggleAll={toggleAll}
                />
                <PaginationBar pagination={pagination} onPageChange={setPage} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
