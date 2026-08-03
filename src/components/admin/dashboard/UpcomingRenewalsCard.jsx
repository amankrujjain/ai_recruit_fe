import { Building2, CalendarClock, Database, Mic, Sparkles, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

function daysUntil(dateStr) {
  const target = new Date(dateStr).getTime();
  if (Number.isNaN(target)) return null;
  return Math.max(0, Math.ceil((target - Date.now()) / 86400000));
}

function UsageStat({ icon: Icon, label, value, unit, showDivider }) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-1',
        showDivider && 'xl:border-l xl:border-border xl:pl-4'
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate text-sm font-bold text-foreground">
          {value}
          {unit && <span className="ml-0.5 text-xs font-normal text-muted">{unit}</span>}
        </p>
      </div>
    </div>
  );
}

export function UpcomingRenewalsCard({ billing, recruiters = [] }) {
  const plan = billing?.currentPlan;
  const usage = billing?.usageSummary || {};
  const daysLeft = plan?.renewalDate ? daysUntil(plan.renewalDate) : null;

  // Approximate an annual cycle progress bar (no plan start date on backend).
  const cyclePercent = daysLeft != null ? Math.min(100, Math.max(0, Math.round(((365 - daysLeft) / 365) * 100))) : 0;

  // TODO(api): usageSummary shape is dynamic; HR seat limit and voice/credit/storage
  // meters below fall back to placeholders when the key isn't provided by the backend.
  const hrLimit = usage.hrMembersLimit ?? usage.seats ?? 25;
  const stats = [
    { icon: Users, label: 'HR Members', value: `${recruiters.length} / ${hrLimit}` },
    { icon: Sparkles, label: 'AI Credits', value: (usage.aiCredits ?? 18000).toLocaleString(), unit: '/month' },
    { icon: Mic, label: 'Voice Minutes', value: (usage.voiceMinutes ?? 420).toLocaleString(), unit: '/month' },
    { icon: Database, label: 'Storage', value: `${usage.storageUsedGb ?? 12} GB`, unit: `/ ${usage.storageLimitGb ?? 100} GB` },
  ];

  const renewalLabel = plan?.renewalDate
    ? new Date(plan.renewalDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-brand-500" strokeWidth={2} />
          <h3 className="font-semibold text-foreground">Upcoming Renewals</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                <Building2 className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold leading-tight text-foreground">
                  {plan?.planName || 'No active plan'}
                </p>
                {renewalLabel && (
                  <p className="mt-0.5 text-sm text-muted">Renews on {renewalLabel}</p>
                )}
              </div>
            </div>
            {daysLeft != null && (
              <div className="shrink-0 text-right">
                <p className="text-2xl font-bold leading-none text-foreground">{daysLeft}</p>
                <p className="mt-1 text-xs text-muted">Days Left</p>
              </div>
            )}
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-brand-100">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-500"
              style={{ width: `${cyclePercent}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-y-4 border-t border-border pt-4 xl:grid-cols-4">
          {stats.map((s, i) => (
            <UsageStat key={s.label} {...s} showDivider={i > 0} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
