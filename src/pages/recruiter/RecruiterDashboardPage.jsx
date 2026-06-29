import { DashboardShell } from '@/components/layout/DashboardShell';
import { RecruiterOverview } from '@/components/recruiter/dashboard/RecruiterOverview';

export function RecruiterDashboardPage() {
  return (
    <DashboardShell title="Recruiter Dashboard">
      <div className="mx-auto max-w-6xl">
        <RecruiterOverview />
      </div>
    </DashboardShell>
  );
}
