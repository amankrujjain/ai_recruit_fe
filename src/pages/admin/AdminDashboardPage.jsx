import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export function AdminDashboardPage() {
  return (
    <DashboardShell title="Admin Dashboard">
      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Coming soon</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Manage recruiters, jobs, and follow-ups from here.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
