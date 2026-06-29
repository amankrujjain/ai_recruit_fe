import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { JobTable } from '@/components/recruiter/jobs/JobTable';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchJobs, selectJobs } from '@/store/slices/jobsSlice';

export function RecruiterJobsPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectJobs);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  useEffect(() => {
    dispatch(fetchJobs({
      page,
      search: debouncedSearch || undefined,
    }));
  }, [dispatch, page, debouncedSearch]);

  return (
    <DashboardShell title="Jobs">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Job postings"
          subtitle="Create and manage roles for your hiring pipeline."
          actionLabel="Create job"
          actionTo="/recruiter/jobs/new"
        />
        <SearchInput value={search} onChange={setSearch} placeholder="Search jobs…" />
        <Card>
          <CardContent className="pt-6">
            <JobTable items={items} loading={loading} />
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
