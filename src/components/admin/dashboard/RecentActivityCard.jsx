import { Link } from 'react-router-dom';
import { Activity, CalendarCheck, FileText, Mail, UserPlus, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { relativeTime } from '@/lib/relativeTime';

function iconForAction(action = '') {
  const a = action.toLowerCase();
  if (a.includes('invite')) return UserPlus;
  if (a.includes('join') || a.includes('recruiter') || a.includes('user')) return Users;
  if (a.includes('email') || a.includes('template')) return Mail;
  if (a.includes('calendar') || a.includes('schedule')) return CalendarCheck;
  if (a.includes('setting') || a.includes('hour') || a.includes('org')) return FileText;
  return Activity;
}

export function RecentActivityCard({ auditLogs = [], loading }) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <h3 className="font-semibold">Recent Activity</h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {loading && auditLogs.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : auditLogs.length === 0 ? (
          <p className="text-sm text-muted">No recent activity.</p>
        ) : (
          <ul className="flex-1 space-y-4">
            {auditLogs.map((log) => {
              const Icon = iconForAction(log.action);
              return (
                <li key={log.auditLogId} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                  <span className="shrink-0 text-xs text-muted">{relativeTime(log.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
        <Link
          to="/admin/audit-logs"
          className="mt-4 text-sm font-medium text-brand-500 hover:text-brand-600"
        >
          View all activity
        </Link>
      </CardContent>
    </Card>
  );
}
