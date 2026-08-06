import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Activity,
  CheckCircle2,
  Clock3,
  Filter,
  RotateCcw,
  ShieldX,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/SelectMenu';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { TablePagination } from '@/components/admin/recruiters/TablePagination';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { listRecruitersRequest } from '@/api/recruiterApi';
import {
  fetchAuditLogs,
  fetchAuditStats,
  selectAdminOrg,
} from '@/store/slices/adminOrgSlice';
import { selectAuth } from '@/store/slices/authSlice';
import {
  ACTION_OPTIONS,
  MODULE_OPTIONS,
  STATUS_OPTIONS,
  defaultDateRange,
} from '@/lib/auditLog';

const emptyDraft = () => ({
  ...defaultDateRange(),
  accountId: '',
  action: '',
  module: '',
  status: '',
});

export function AdminAuditLogsPage() {
  usePageTitle('Audit Logs');
  const dispatch = useDispatch();
  const { auditLogs, auditPagination, auditLoading, auditStats } = useSelector(selectAdminOrg);
  const { account: currentAccount } = useSelector(selectAuth);

  const [draft, setDraft] = useState(emptyDraft);
  const [applied, setApplied] = useState(emptyDraft);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [users, setUsers] = useState([]);
  const [booting, setBooting] = useState(true);

  const queryParams = useMemo(() => {
    const params = {
      page,
      limit,
    };
    if (applied.startDate) params.startDate = applied.startDate;
    if (applied.endDate) params.endDate = applied.endDate;
    if (applied.accountId) params.accountId = applied.accountId;
    if (applied.action) params.action = applied.action;
    if (applied.module) params.module = applied.module;
    if (applied.status) params.status = applied.status;
    return params;
  }, [applied, page, limit]);

  const statsParams = useMemo(() => {
    const params = {};
    if (applied.startDate) params.startDate = applied.startDate;
    if (applied.endDate) params.endDate = applied.endDate;
    return params;
  }, [applied.startDate, applied.endDate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await listRecruitersRequest({ limit: 100 });
        const list = data.data || [];
        // Include current org admin if not already in recruiters list
        if (
          currentAccount?.accountId &&
          !list.some((u) => u.accountId === currentAccount.accountId)
        ) {
          list.unshift({
            accountId: currentAccount.accountId,
            firstName: currentAccount.firstName,
            lastName: currentAccount.lastName,
            email: currentAccount.email,
          });
        }
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled && currentAccount?.accountId) {
          setUsers([
            {
              accountId: currentAccount.accountId,
              firstName: currentAccount.firstName,
              lastName: currentAccount.lastName,
              email: currentAccount.email,
            },
          ]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentAccount]);

  useEffect(() => {
    let alive = true;
    Promise.all([
      dispatch(fetchAuditLogs(queryParams)),
      dispatch(fetchAuditStats(statsParams)),
    ])
      .catch(() => {})
      .finally(() => {
        if (alive) setBooting(false);
      });
    return () => {
      alive = false;
    };
  }, [dispatch, queryParams, statsParams]);

  const updateDraft = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setPage(1);
    setApplied({ ...draft });
  };

  const resetFilters = () => {
    const next = emptyDraft();
    setDraft(next);
    setApplied(next);
    setPage(1);
  };

  const handleLimitChange = (value) => {
    setLimit(Number(value) || 10);
    setPage(1);
  };

  if (booting) {
    return <PageContentSkeleton />;
  }

  const stats = auditStats || {
    total: 0,
    success: 0,
    failed: 0,
    successRate: 0,
    failedRate: 0,
    activeUsers: 0,
    avgDaily: 0,
    totalTrendPct: null,
  };

  const trendText =
    stats.totalTrendPct == null
      ? null
      : `${stats.totalTrendPct > 0 ? '+' : ''}${stats.totalTrendPct}% vs prior period`;

  return (
    <div className="mx-auto w-full max-w-8xl space-y-6">
      <PageHeader
        title="Audit Logs"
        subtitle="Track and monitor all important activities performed in your organization."
      />

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">From</Label>
              <Input
                type="date"
                value={draft.startDate}
                onChange={(e) => updateDraft('startDate', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">To</Label>
              <Input
                type="date"
                value={draft.endDate}
                onChange={(e) => updateDraft('endDate', e.target.value)}
                className="h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">User</Label>
              <FilterSelect
                value={draft.accountId}
                onValueChange={(v) => updateDraft('accountId', v)}
                allLabel="All Users"
                options={users.map((u) => ({
                  value: u.accountId,
                  label: `${u.firstName} ${u.lastName}`.trim(),
                }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">Action</Label>
              <FilterSelect
                value={draft.action}
                onValueChange={(v) => updateDraft('action', v)}
                allLabel="All Actions"
                options={ACTION_OPTIONS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">Module</Label>
              <FilterSelect
                value={draft.module}
                onValueChange={(v) => updateDraft('module', v)}
                allLabel="All Modules"
                options={MODULE_OPTIONS}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted">Status</Label>
              <FilterSelect
                value={draft.status}
                onValueChange={(v) => updateDraft('status', v)}
                allLabel="All Status"
                options={STATUS_OPTIONS}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={resetFilters} className="h-10">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
            <Button type="button" size="sm" onClick={applyFilters} className="h-10">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          icon={Activity}
          tone="brand"
          label="Total Activities"
          value={stats.total}
          subtext={trendText || 'In selected period'}
        />
        <StatCard
          icon={CheckCircle2}
          tone="success"
          label="Successful Activities"
          value={stats.success}
          subtext={`${stats.successRate}% of total`}
        />
        <StatCard
          icon={ShieldX}
          tone="danger"
          label="Failed Activities"
          value={stats.failed}
          subtext={`${stats.failedRate}% of total`}
        />
        <StatCard
          icon={Users}
          tone="brand"
          label="Active Users"
          value={stats.activeUsers}
          subtext="Users performed actions"
        />
        <StatCard
          icon={Clock3}
          tone="warning"
          label="Avg. Daily Activities"
          value={stats.avgDaily}
          subtext="Across selected range"
        />
      </div>

      <Card>
        <CardContent className="space-y-5 pt-6">
          <AuditLogTable items={auditLogs} loading={auditLoading} />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0 flex-1">
              <TablePagination
                pagination={auditPagination}
                onPageChange={setPage}
              />
            </div>
            {auditPagination?.total > 0 && (
              <div className="flex shrink-0 items-center gap-2 self-end pb-0.5 sm:self-auto">
                <Label className="text-xs text-muted">Rows</Label>
                <FilterSelect
                  value={String(limit)}
                  onValueChange={handleLimitChange}
                  className="h-9 min-w-[8.5rem] w-[8.5rem] whitespace-nowrap"
                  options={[
                    { value: '10', label: '10 / page' },
                    { value: '25', label: '25 / page' },
                    { value: '50', label: '50 / page' },
                  ]}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
