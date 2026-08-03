import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Circle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { CircularProgress } from '@/components/admin/dashboard/CircularProgress';

export function buildSetupChecklist({ organization, recruiters = [] }) {
  return [
    { label: 'Organization Profile', done: Boolean(organization?.organizationName) },
    { label: 'Company Logo', done: Boolean(organization?.logoUrl) },
    { label: 'HR Members Invited', done: recruiters.length > 0 },
    { label: 'Email Templates', done: (organization?.emailTemplates?.length || 0) > 0 },
    {
      label: 'Working Hours',
      done: Boolean(organization?.workingHoursStart && organization?.workingHoursEnd),
    },
    // TODO(api): no calendar-connection status on backend yet.
    { label: 'Calendar Connected', done: false },
  ];
}

export function OrganizationSetupCard({ organization, recruiters = [] }) {
  const items = buildSetupChecklist({ organization, recruiters });
  const completed = items.filter((i) => i.done).length;
  const percent = Math.round((completed / items.length) * 100);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <h3 className="font-semibold">Organization Setup</h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        <div className="flex items-center gap-5">
          <CircularProgress value={percent} />
          <ul className="flex-1 space-y-2.5">
            {items.map((item) => (
              <li key={item.label} className="flex items-center gap-2 text-sm">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-warning-500" />
                )}
                <span className={item.done ? 'text-foreground' : 'text-muted'}>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <Link
          to="/admin/settings"
          className="mt-6 inline-flex w-fit items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-colors hover:bg-brand-700"
        >
          Complete Setup
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
