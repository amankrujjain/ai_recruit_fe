import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

function formatInterviewTime(iso, timeZone) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timeZone || undefined,
    });
  } catch {
    return new Date(iso).toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
    });
  }
}

export function TodaysInterviewsCard({ interviews, orgTimezone }) {
  return (
    <Card id="todays-interviews">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Today&apos;s interviews</h3>
          <Link to="/recruiter/interviews" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>

        {!interviews?.length ? (
          <p className="py-4 text-center text-sm text-muted">No interviews scheduled for today.</p>
        ) : (
          <ul className="space-y-3">
            {interviews.map((item) => (
              <li
                key={item.callScheduleId}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">
                    {formatInterviewTime(item.scheduledAt, orgTimezone)}
                  </p>
                  <p className="truncate text-sm font-semibold text-foreground">{item.candidateName}</p>
                  <p className="truncate text-xs text-muted">
                    {item.jobTitle} · Round {item.round || 1}
                  </p>
                </div>
                <Badge variant="success">Booked</Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
