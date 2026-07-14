import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { InviteRecruiterForm } from '@/components/admin/recruiters/InviteRecruiterForm';
import { RecruiterInviteBanner } from '@/components/admin/recruiters/RecruiterInviteBanner';
import { RecruiterTable } from '@/components/admin/recruiters/RecruiterTable';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchRecruiters, selectRecruiters } from '@/store/slices/recruitersSlice';

export function AdminRecruitersPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectRecruiters);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);

  const load = () => dispatch(fetchRecruiters({
    page,
    search: debouncedSearch || undefined,
    status: status || undefined,
  }));

  useEffect(() => { setPage(1); }, [debouncedSearch, status]);
  useEffect(() => { load(); }, [dispatch, page, debouncedSearch, status]);

  return (
    <DashboardShell title="Recruiters">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Team recruiters" subtitle="Invite and manage recruiters in your organization." />
        {/* <RecruiterInviteBanner /> */}
        <InviteRecruiterForm onInvited={load} />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search recruiters..." />
          <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
          </Select>
        </div>
        <Card>
          <CardContent className="pt-6">
            <RecruiterTable items={items} loading={loading} />
            <PaginationBar pagination={pagination} onPageChange={setPage} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
