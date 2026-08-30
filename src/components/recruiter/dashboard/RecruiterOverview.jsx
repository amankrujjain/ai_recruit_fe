import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { selectAdminOrg } from '@/store/slices/adminOrgSlice';
import {
  fetchDashboardOverview,
  rejectCandidateFromDashboard,
  retryFailedInvite,
  selectRecruitment,
} from '@/store/slices/recruitmentSlice';
import { DashboardHeader } from '@/components/recruiter/dashboard/DashboardHeader';
import { NeedsAttentionPanel } from '@/components/recruiter/dashboard/NeedsAttentionPanel';
import { PipelineFunnelCard } from '@/components/recruiter/dashboard/PipelineFunnelCard';
import { TodaysInterviewsCard } from '@/components/recruiter/dashboard/TodaysInterviewsCard';
import { DashboardStatRow } from '@/components/recruiter/dashboard/DashboardStatRow';

export function RecruiterOverview() {
  const dispatch = useDispatch();
  const { organization } = useSelector(selectAdminOrg);
  const { overview, overviewLoading, actionLoading, error } = useSelector(selectRecruitment);

  const booting = usePageBootstrap(
    () => dispatch(fetchDashboardOverview()),
    [dispatch]
  );

  const handleRetry = async (outreachRecordId) => {
    const result = await dispatch(retryFailedInvite(outreachRecordId));
    if (retryFailedInvite.fulfilled.match(result)) {
      toast.success('Invite re-queued');
    } else {
      toast.error(result.payload || 'Failed to retry invite');
    }
  };

  const handleReject = async (candidateJobId) => {
    const result = await dispatch(rejectCandidateFromDashboard(candidateJobId));
    if (rejectCandidateFromDashboard.fulfilled.match(result)) {
      toast.success('Candidate rejected');
    } else {
      toast.error(result.payload || 'Failed to reject candidate');
    }
  };

  if (booting || (overviewLoading && !overview)) {
    return <PageContentSkeleton />;
  }

  if (error && !overview) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  const orgName =
    organization?.settings?.displayName
    || organization?.organizationName
    || 'Your organization';

  return (
    <div className="space-y-6" data-testid="recruiter-overview">
      <DashboardHeader orgName={orgName} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <NeedsAttentionPanel
            attention={overview?.attention}
            onRetry={handleRetry}
            onReject={handleReject}
            actionLoading={actionLoading}
          />
          <DashboardStatRow
            jobs={overview?.jobs}
            invitedThisWeek={overview?.invitedThisWeek}
            funnel={overview?.funnel}
            todaysInterviews={overview?.todaysInterviews}
          />
        </div>
        <div className="space-y-4">
          <PipelineFunnelCard
            funnel={overview?.funnel}
            matchThreshold={overview?.matchThreshold}
          />
          <TodaysInterviewsCard
            interviews={overview?.todaysInterviews}
            orgTimezone={overview?.orgTimezone}
          />
        </div>
      </div>
    </div>
  );
}
