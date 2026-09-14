import { useEffect, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { JobTable } from '@/components/recruiter/jobs/JobTable';
import { JobsListToolbar } from '@/components/recruiter/jobs/JobsListToolbar';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { filterJobsByStatusFilter } from '@/lib/jobStatus';
import { deleteJob, fetchJobs, selectJobs } from '@/store/slices/jobsSlice';

function statusFilterToIsActive(statusFilter) {
  if (statusFilter === 'active') return true;
  if (statusFilter === 'inactive') return false;
  return undefined;
}

export function RecruiterJobsPage() {
  usePageTitle('Jobs');
  const dispatch = useDispatch();
  const { items, pagination, summary, loading, deletingJobId } = useSelector(selectJobs);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const isActive = statusFilterToIsActive(statusFilter);

  const booting = usePageBootstrap(
    () =>
      dispatch(
        fetchJobs({
          page,
          search: debouncedSearch || undefined,
          isActive,
        })
      ),
    [dispatch, page, debouncedSearch, statusFilter]
  );

  const visibleItems = useMemo(
    () => filterJobsByStatusFilter(items, statusFilter),
    [items, statusFilter]
  );

  const handleDeleteRequest = (job) => {
    setDeleteTarget(job);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const result = await dispatch(deleteJob(deleteTarget.jobId));
    setDeleteTarget(null);
    if (deleteJob.fulfilled.match(result)) {
      toast.success('Job deleted');
    } else {
      toast.error(result.payload || 'Failed to delete job');
    }
  };

  if (booting) {
    return <PageContentSkeleton />;
  }

  const activeCount = summary?.active ?? 0;
  const totalCount = summary?.total ?? pagination?.total ?? 0;
  const subtitle = `${activeCount} active · ${totalCount} total`;

  return (
    <div className="mx-auto w-full max-w-8xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Job postings</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <Button className="shrink-0 shadow-md shadow-brand-600/20" asChild>
          <Link to="/recruiter/jobs/new">
            <Plus className="mr-1.5 h-4 w-4" aria-hidden />
            Create job
          </Link>
        </Button>
      </div>

      <JobsListToolbar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <Card className="rounded-xl border-border shadow-none">
        <CardContent className="p-0">
          <JobTable
            items={visibleItems}
            loading={loading}
            statusFilter={statusFilter}
            hasSearch={Boolean(debouncedSearch?.trim())}
            onDelete={handleDeleteRequest}
            deletingJobId={deletingJobId}
          />
          {pagination?.totalPages > 1 && (
            <div className="border-t border-border px-5 py-3">
              <PaginationBar pagination={pagination} onPageChange={setPage} />
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete job?"
        description={
          deleteTarget
            ? `Are you sure you want to delete "${deleteTarget.jobTitle}"? This will remove the job and its pipeline data. This action cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        loading={Boolean(deletingJobId)}
        onOpenChange={(open) => {
          if (!open && !deletingJobId) setDeleteTarget(null);
        }}
        onCancel={() => {
          if (!deletingJobId) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
