import { Briefcase, CheckCircle2, Send, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';

export function DashboardStatRow({ jobs, invitedThisWeek, funnel, todaysInterviews }) {
  const active = jobs?.active ?? 0;
  const inactive = jobs?.inactive ?? 0;
  const invited = invitedThisWeek?.count ?? 0;
  const jobCount = invitedThisWeek?.jobCount ?? 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <Video className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Interviews today</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{todaysInterviews?.length ?? 0}</p>
            <p className="mt-1 text-xs text-muted">scheduled calls</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-start gap-4 pt-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Selected total</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{funnel?.selected ?? 0}</p>
            <p className="mt-1 text-xs text-muted">shortlisted candidates</p>
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
