import { Eye, Trash2, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DEFAULT_ELIGIBILITY_THRESHOLD,
  EligibilityStatus,
  formatCandidateSubtitle,
  formatEligibilityLabel,
  formatOutreachLabel,
  getCandidateInitials,
  getEligibilityStatus,
  getMatchBarClass,
  getOutreachDisplayStatus,
  hasOutreach,
  isCandidateSelectable,
  OutreachDisplayStatus,
} from '@/lib/candidateEligibility';
import { cn } from '@/lib/utils';

function MatchCell({ score }) {
  if (score == null) {
    return <span className="text-muted">—</span>;
  }
  const value = Math.max(0, Math.min(100, Number(score)));
  return (
    <div className="flex min-w-[128px] max-w-[160px] items-center gap-2">
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full', getMatchBarClass(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {Math.round(value)}%
      </span>
    </div>
  );
}

function EligibilityCell({ status, threshold }) {
  const label = formatEligibilityLabel(status, threshold);
  if (status === EligibilityStatus.ELIGIBLE) {
    return <Badge variant="muted">{label}</Badge>;
  }
  return <span className="text-sm text-muted">{label}</span>;
}

function OutreachCell({ row }) {
  const display = getOutreachDisplayStatus(row);
  const label = formatOutreachLabel(row);

  if (display === OutreachDisplayStatus.NONE) {
    return <span className="text-sm text-muted">{label}</span>;
  }

  const variant =
    display === OutreachDisplayStatus.EMAIL_SENT || display === OutreachDisplayStatus.SCHEDULED
      ? 'success'
      : display === OutreachDisplayStatus.EMAIL_QUEUED
        ? 'warning'
        : 'muted';

  const showMail =
    display === OutreachDisplayStatus.EMAIL_SENT
    || display === OutreachDisplayStatus.EMAIL_QUEUED
    || display === OutreachDisplayStatus.SELECTED;

  return (
    <Badge variant={variant} className="gap-1.5 px-2.5 py-1 text-sm font-medium">
      {showMail ? <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden /> : null}
      {label}
    </Badge>
  );
}

export function CandidateTable({
  items,
  loading,
  selectedIds,
  deletingId,
  threshold = DEFAULT_ELIGIBILITY_THRESHOLD,
  onToggle,
  onDelete,
  onViewInterview,
  onInviteOne,
  invitingId,
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading candidates…</p>;
  }

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No candidates yet. Upload resumes to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10 px-4 py-3">
              <span className="sr-only">Select</span>
            </th>
            <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Candidate
            </th>
            <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Match
            </th>
            <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Eligibility
            </th>
            <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Outreach
            </th>
            <th className="px-3 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const id = row.candidateJobId;
            const candidate = row.candidate || {};
            const name = candidate.name || 'Unknown';
            const deleting = deletingId === id;
            const status = getEligibilityStatus(row, threshold);
            const selectable = isCandidateSelectable(row, threshold);
            const eligible = status === EligibilityStatus.ELIGIBLE;
            const dimmed = status === EligibilityStatus.NOT_ELIGIBLE;
            const outreached = hasOutreach(row);
            const showInvite = eligible;
            const inviteDisabled = outreached || invitingId === id;

            return (
              <tr
                key={id}
                className={cn(
                  'border-b border-border last:border-b-0',
                  dimmed ? 'bg-slate-50/90 text-muted' : 'hover:bg-slate-50/80'
                )}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectable && selectedIds.has(id)}
                    disabled={!selectable}
                    onChange={() => selectable && onToggle(id)}
                    aria-label={`Select ${name}`}
                    className="rounded border-border disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </td>
                <td className="px-3 py-3">
                  <div className={cn('flex items-center gap-3', dimmed && 'opacity-70')}>
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        dimmed
                          ? 'bg-slate-200 text-slate-500'
                          : 'bg-brand-50 text-brand-700'
                      )}
                    >
                      {getCandidateInitials(name)}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'truncate font-semibold',
                          dimmed ? 'text-slate-500' : 'text-foreground'
                        )}
                      >
                        {name}
                      </p>
                      <p className="truncate text-xs text-muted">{formatCandidateSubtitle(row)}</p>
                    </div>
                  </div>
                </td>
                <td className={cn('px-3 py-3', dimmed && 'opacity-70')}>
                  <MatchCell score={row.overallMatch} />
                </td>
                <td className="px-3 py-3">
                  <EligibilityCell status={status} threshold={threshold} />
                </td>
                <td className={cn('px-3 py-3', dimmed && 'opacity-70')}>
                  <OutreachCell row={row} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap items-center justify-start gap-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`View ${name}`}
                      onClick={() => onViewInterview?.(row)}
                    >
                      <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      View
                    </Button>
                    {showInvite && (
                      <Button
                        type="button"
                        size="sm"
                        disabled={inviteDisabled}
                        title={outreached ? 'Already invited' : undefined}
                        aria-label={outreached ? `Invite ${name} (already sent)` : `Invite ${name}`}
                        onClick={() => onInviteOne?.(row)}
                      >
                        <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        {invitingId === id ? 'Inviting…' : 'Invite'}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      disabled={deleting}
                      aria-label={`Remove ${name}`}
                      onClick={() => onDelete?.(row)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                      {deleting ? 'Removing…' : 'Remove'}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
