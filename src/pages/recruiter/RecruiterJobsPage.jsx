import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { SearchInput } from '@/components/ui/SearchInput';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { JobTable } from '@/components/recruiter/jobs/JobTable';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { fetchJobs, selectJobs } from '@/store/slices/jobsSlice';

export function RecruiterJobsPage() {
  usePageTitle('Jobs');
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectJobs);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const booting = usePageBootstrap(
    () => dispatch(fetchJobs({
      page,
      search: debouncedSearch || undefined,
    })),
    [dispatch, page, debouncedSearch]
  );

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
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
  );
}
