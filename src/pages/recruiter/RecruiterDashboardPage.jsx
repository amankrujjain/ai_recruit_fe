import { usePageTitle } from '@/context/PageTitleContext';
import { RecruiterOverview } from '@/components/recruiter/dashboard/RecruiterOverview';

export function RecruiterDashboardPage() {
  usePageTitle('Recruiter Dashboard');

  return (
    <div className="mx-auto max-w-6xl">
      <RecruiterOverview />
    </div>
  );
}
