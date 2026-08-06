import { usePageTitle } from '@/context/PageTitleContext';
import { AdminOverview } from '@/components/admin/dashboard/AdminOverview';

export function AdminDashboardPage() {
  usePageTitle('Dashboard');

  return (
    <div className="mx-auto w-full max-w-8xl">
      <AdminOverview />
    </div>
  );
}
