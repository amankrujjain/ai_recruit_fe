import { DashboardShell } from '@/components/layout/DashboardShell';
import { AdminOverview } from '@/components/admin/dashboard/AdminOverview';

export function AdminDashboardPage() {
  return (
    <DashboardShell title="Admin Dashboard">
      <div className="mx-auto max-w-6xl">
        <AdminOverview />
      </div>
    </DashboardShell>
  );
}
