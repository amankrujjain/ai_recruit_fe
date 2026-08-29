import { Briefcase, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export function DashboardStatRow({ jobs, invitedThisWeek }) {
  const active = jobs?.active ?? 0;
  const inactive = jobs?.inactive ?? 0;
  const invited = invitedThisWeek?.count ?? 0;
  const jobCount = invitedThisWeek?.jobCount ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="flex items-start gap-4 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Briefcase className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Active jobs</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{active}</p>
            <p className="mt-1 text-xs text-muted">
              {inactive} inactive
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-start gap-4 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <Send className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Invited this week</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{invited}</p>
            <p className="mt-1 text-xs text-muted">
              across {jobCount} job{jobCount === 1 ? '' : 's'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
