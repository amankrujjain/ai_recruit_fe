import { usePageTitle } from '@/context/PageTitleContext';
import { AdminOverview } from '@/components/admin/dashboard/AdminOverview';

export function AdminDashboardPage() {
  usePageTitle('Dashboard');

  return (
    <div className="mx-auto max-w-7xl">
      <AdminOverview />
    </div>
  );
}
