import { useDispatch, useSelector } from 'react-redux';
import { Building2, Mail, UserCheck, Users } from 'lucide-react';
import { UserStatus } from '@/lib/userStatus';
import { fetchRecruiters, selectRecruiters } from '@/store/slices/recruitersSlice';
import {
  fetchMyOrganization,
  fetchBilling,
  fetchAuditLogs,
  selectAdminOrg,
} from '@/store/slices/adminOrgSlice';
import { StatCard } from '@/components/admin/dashboard/StatCard';
import { OrganizationSetupCard } from '@/components/admin/dashboard/OrganizationSetupCard';
import { RecentActivityCard } from '@/components/admin/dashboard/RecentActivityCard';
import { QuickActionsCard } from '@/components/admin/dashboard/QuickActionsCard';
import { UpcomingRenewalsCard } from '@/components/admin/dashboard/UpcomingRenewalsCard';
import { NotificationsCard } from '@/components/admin/dashboard/NotificationsCard';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';

function daysUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return null;
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

export function AdminOverview() {
  const dispatch = useDispatch();
  const { items: recruiters } = useSelector(selectRecruiters);
  const { organization, billing, auditLogs, auditLoading } = useSelector(selectAdminOrg);

  const booting = usePageBootstrap(
    () => Promise.all([
      dispatch(fetchMyOrganization()),
      dispatch(fetchRecruiters({ limit: 100 })),
      dispatch(fetchBilling()),
      dispatch(fetchAuditLogs({ limit: 5 })),
    ]),
    [dispatch]
  );

  const activeCount = recruiters.filter((r) => r.status === UserStatus.ACTIVE).length;
  const pendingCount = recruiters.filter((r) => r.status === UserStatus.PENDING).length;
  const daysLeft = billing?.currentPlan?.renewalDate ? daysUntil(billing.currentPlan.renewalDate) : null;

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} tone="brand" label="Total HR Members" value={recruiters.length} subtext="Across your organization" />
        <StatCard icon={UserCheck} tone="success" label="Active HR" value={activeCount} subtext="Currently active" />
        <StatCard icon={Mail} tone="warning" label="Pending Invitations" value={pendingCount} subtext={pendingCount === 0 ? 'No change' : 'Awaiting response'} />
        <StatCard icon={Building2} tone="brand" label="Departments" value="—" subtext="Not configured yet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <OrganizationSetupCard organization={organization} recruiters={recruiters} />
        <RecentActivityCard auditLogs={auditLogs} loading={auditLoading} />
        <QuickActionsCard />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UpcomingRenewalsCard billing={billing} recruiters={recruiters} />
        </div>
        <NotificationsCard pendingCount={pendingCount} daysLeft={daysLeft} />
      </div>
    </div>
  );
}
