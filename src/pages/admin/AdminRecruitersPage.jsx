import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Mail, RotateCcw, UserCheck, UserPlus, Users } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Label } from '@/components/ui/Label';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { InviteRecruiterModal } from '@/components/admin/recruiters/InviteRecruiterModal';
import { InviteHrCta } from '@/components/admin/recruiters/InviteHrCta';
import { RecruiterTable } from '@/components/admin/recruiters/RecruiterTable';
import { TablePagination } from '@/components/admin/recruiters/TablePagination';
import { RecruiterInviteBanner } from '@/components/admin/recruiters/RecruiterInviteBanner';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { listRecruitersRequest } from '@/api/recruiterApi';
import { fetchRecruiters, selectRecruiters } from '@/store/slices/recruitersSlice';
import { UserStatus } from '@/lib/userStatus';

export function AdminRecruitersPage() {
  usePageTitle('HR Team');
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectRecruiters);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  // TODO(api): department filter not supported by backend yet
  const [department, setDepartment] = useState('');
  const [page, setPage] = useState(1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

  // Debounce search (500ms); trim so "  " doesn't hit the API
  const debouncedSearch = useDebouncedValue(search.trim(), 500);
  const isSearching = search.trim() !== debouncedSearch;

  const loadStats = async () => {
    try {
      // Separate aggregate fetch so paginated redux items are not overwritten.
      const { data } = await listRecruitersRequest({ limit: 100 });
      const list = data.data || [];
      setStats({
        total: data.pagination?.total ?? list.length,
        active: list.filter((r) => r.status === UserStatus.ACTIVE).length,
        pending: list.filter((r) => r.status === UserStatus.PENDING).length,
      });
    } catch {
      /* ignore — stats are best-effort */
    }
  };

  // Reset to page 1 as soon as the user types / changes status (before debounce fires)
  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const booting = usePageBootstrap(
    () => Promise.all([
      dispatch(
        fetchRecruiters({
          page,
          search: debouncedSearch || undefined,
          status: status || undefined,
        })
      ),
      loadStats(),
    ]),
    [dispatch, page, debouncedSearch, status]
  );

  const clearFilters = () => {
    setSearch('');
    setStatus('');
    setDepartment('');
    setPage(1);
  };

  const handleInvited = () => {
    dispatch(
      fetchRecruiters({
        page,
        search: debouncedSearch || undefined,
        status: status || undefined,
      })
    );
    loadStats();
  };

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="HR Team"
          subtitle="Invite and manage HR professionals who will use RecruitAI."
          actionLabel={
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite HR Member
            </>
          }
          onAction={() => setInviteOpen(true)}
        />

        <RecruiterInviteBanner />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Users}
            tone="brand"
            label="Total HR Members"
            value={stats.total}
            subtext="Across your organization"
          />
          <StatCard
            icon={UserCheck}
            tone="success"
            label="Active HR"
            value={stats.active}
            subtext="Currently active"
          />
          <StatCard
            icon={Mail}
            tone="warning"
            label="Pending Invitations"
            value={stats.pending}
            subtext={stats.pending === 0 ? 'No change' : 'Awaiting response'}
          />
          {/* TODO(api): departments count not available on backend yet */}
          <StatCard
            icon={Building2}
            tone="brand"
            label="Departments"
            value="—"
            subtext="Not configured yet"
          />
        </div>

        {/* Single container: filters + table + pagination */}
        <Card>
          <CardContent className="space-y-5 pt-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1 lg:max-w-sm">
                <SearchInput
                  value={search}
                  onChange={setSearch}
                  placeholder="Search HR members..."
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                {/* TODO(api): department filter not supported by backend yet */}
                <div className="w-full space-y-1.5 sm:w-40">
                  <Label className="text-xs font-medium text-muted">Department</Label>
                  <Select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="h-10"
                  >
                    <option value="">All</option>
                    <option value="talent">Talent Acquisition</option>
                    <option value="recruitment">Recruitment</option>
                    <option value="campus">Campus Hiring</option>
                  </Select>
                </div>

                <div className="w-full space-y-1.5 sm:w-36">
                  <Label className="text-xs font-medium text-muted">Status</Label>
                  <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-10"
                  >
                    <option value="">All</option>
                    <option value="PENDING">Pending</option>
                    <option value="ACTIVE">Active</option>
                    <option value="DISABLED">Disabled</option>
                  </Select>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-10 shrink-0 items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-brand-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear Filters
                </button>
              </div>
            </div>

            <RecruiterTable items={items} loading={loading || isSearching} />
            <TablePagination pagination={pagination} onPageChange={setPage} />
          </CardContent>
        </Card>

        <InviteHrCta onInvite={() => setInviteOpen(true)} />

        <InviteRecruiterModal
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          onInvited={handleInvited}
        />
      </div>
  );
}
