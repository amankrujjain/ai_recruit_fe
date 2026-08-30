import { Link } from 'react-router-dom';
import { AlertCircle, Star, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

function ScorecardReviewCard({ items }) {
  if (!items?.length) return null;

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Star className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold text-foreground">
              {items.length} scorecard{items.length === 1 ? '' : 's'} waiting for your review
            </p>
            <p className="text-sm text-muted">AI screening complete — decide next steps.</p>
          </div>
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.candidateJobId}
              className="flex flex-col gap-2 rounded-lg border border-border bg-surface px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{item.candidateName}</p>
                <p className="truncate text-xs text-muted">{item.jobTitle}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">
                    {item.overallMatch != null ? `${Math.round(item.overallMatch)}%` : '—'} match
                  </span>
                  <span
                    className={cn(
                      'h-1.5 w-16 rounded-full',
                      item.matchLabel === 'STRONG' ? 'bg-brand-500' : 'bg-amber-400'
                    )}
                  />
                  <span className="text-xs text-muted">
                    {item.matchLabel === 'STRONG' ? 'Strong match' : 'Good match'}
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to={`/recruiter/jobs/${item.jobId}/candidates/${item.candidateJobId}`}>
                  Open scorecard
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function DeliveryFailureCard({ items, onRetry, actionLoading }) {
  if (!items?.length) return null;

  return (
    <>
      {items.map((item) => (
        <Card key={item.outreachRecordId}>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <AlertCircle className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">Invite delivery failed</p>
                <p className="mt-1 text-sm text-muted">
                  The Round 1 invite to {item.candidateName} ({item.jobTitle}) bounced.
                  {item.lastError ? ` ${item.lastError}` : ' Check the address and resend.'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/recruiter/jobs/${item.jobId}?tab=candidates`}>Edit email</Link>
              </Button>
              <Button
                size="sm"
                disabled={actionLoading === item.outreachRecordId}
                onClick={() => onRetry?.(item.outreachRecordId)}
              >
                {actionLoading === item.outreachRecordId ? 'Retrying…' : 'Retry invite'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function NoShowCard({ items, onReject, actionLoading }) {
  if (!items?.length) return null;

  return (
    <>
      {items.map((item) => (
        <Card key={item.callScheduleId}>
          <CardContent className="space-y-4 pt-5">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Video className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-foreground">Interview no-show</p>
                <p className="mt-1 text-sm text-muted">
                  No-show after {item.rescheduleCount} reschedule
                  {item.rescheduleCount === 1 ? '' : 's'}. {item.candidateName} ({item.jobTitle})
                  didn&apos;t attend. Decide how to proceed.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/recruiter/jobs/${item.jobId}/candidates/${item.candidateJobId}`}>
                  View profile
                </Link>
              </Button>
              <button
                type="button"
                className="px-3 text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                disabled={actionLoading === item.candidateJobId}
                onClick={() => onReject?.(item.candidateJobId)}
              >
                {actionLoading === item.candidateJobId ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

export function NeedsAttentionPanel({ attention, onRetry, onReject, actionLoading }) {
  const total = attention?.total ?? 0;
  const hasItems =
    (attention?.scorecards?.length || 0)
    + (attention?.failedInvites?.length || 0)
    + (attention?.noShows?.length || 0) > 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-foreground">Needs your attention</h2>
        <Badge variant={total > 0 ? 'default' : 'muted'}>{total}</Badge>
      </div>

      {!hasItems ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted">
            You&apos;re all caught up — nothing needs attention right now.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <ScorecardReviewCard items={attention.scorecards} />
          <DeliveryFailureCard
            items={attention.failedInvites}
            onRetry={onRetry}
            actionLoading={actionLoading}
          />
          <NoShowCard
            items={attention.noShows}
            onReject={onReject}
            actionLoading={actionLoading}
          />
        </div>
      )}
    </section>
  );
}
