import { Link } from 'react-router-dom';
import { Building2, ClipboardList, CreditCard, Settings2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

const actions = [
  { to: '/admin/recruiters', label: 'Invite HR Member', icon: UserPlus, primary: true },
  // TODO(api): departments management screen not built yet.
  { to: '/admin/settings', label: 'Manage Departments', icon: Building2 },
  { to: '/admin/settings', label: 'Organization Settings', icon: Settings2 },
  { to: '/admin/billing', label: 'Billing & Plan', icon: CreditCard },
  { to: '/admin/audit-logs', label: 'View Audit Logs', icon: ClipboardList },
];

export function QuickActionsCard() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <h3 className="font-semibold">Quick Actions</h3>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {actions.map(({ to, label, icon: Icon, primary }) => (
          <Link
            key={label}
            to={to}
            className={
              primary
                ? 'flex items-center gap-3 rounded-lg bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-colors hover:bg-brand-700'
                : 'flex items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-brand-50 hover:text-brand-700'
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
