import { DashboardShell } from '@/components/layout/DashboardShell';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

export function RecruiterDashboardPage() {
  return (
    <DashboardShell title="Recruiter Dashboard">
      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="text-lg font-semibold">Coming soon</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            Your candidates, calls, and outreach pipeline will appear here.
          </p>
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
