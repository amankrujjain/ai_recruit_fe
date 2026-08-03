import { Link } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function NotificationsCard({ pendingCount = 0, daysLeft }) {
  const items = [];

  if (pendingCount > 0) {
    items.push({
      tone: 'warning',
      message: `${pendingCount} HR invitation${pendingCount > 1 ? 's are' : ' is'} pending`,
      action: { label: 'View', to: '/admin/recruiters' },
    });
  }

  // TODO(api): calendar connection status not exposed by backend yet.
  items.push({
    tone: 'brand',
    message: 'Google Calendar needs attention',
    action: { label: 'Connect', to: '/admin/settings' },
  });

  if (daysLeft != null) {
    items.push({
      tone: 'warning',
      message: `Your plan will renew in ${daysLeft} days`,
      action: { label: 'View', to: '/admin/billing' },
    });
  }

  // TODO(api): product announcements are static for now.
  items.push({
    tone: 'success',
    message: 'New feature: Bulk HR Invite',
    action: { label: 'Learn more', to: '/admin/recruiters' },
  });

  const dotTone = {
    warning: 'bg-warning-500',
    brand: 'bg-brand-600',
    success: 'bg-success-500',
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-500" strokeWidth={2} />
          <h3 className="font-semibold text-foreground">Notifications</h3>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', dotTone[item.tone])} />
              <span className="min-w-0 flex-1 text-sm leading-snug text-foreground">{item.message}</span>
              <Link
                to={item.action.to}
                className="shrink-0 text-sm font-semibold text-brand-500 hover:text-brand-600"
              >
                {item.action.label}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
