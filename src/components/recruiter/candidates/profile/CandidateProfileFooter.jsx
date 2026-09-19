import { Button } from '@/components/ui/Button';

/**
 * C11: light Decision mirror — Hired / Reject / Next Round only.
 */
export function CandidateProfileFooter({
  saving,
  locked,
  nextStepLabel,
  canInviteNext,
  onInviteNext,
  onReject,
  onHire,
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          {locked
            ? 'Decision complete for this candidate.'
            : 'Same actions as the Decisions tab — Hired, Reject, or invite to the next AI round.'}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {locked ? null : (
            <>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={onHire}
              >
                Hired
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={saving}
                onClick={onReject}
              >
                Reject
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving || !canInviteNext || !onInviteNext}
                onClick={onInviteNext}
              >
                {canInviteNext && nextStepLabel ? nextStepLabel : 'Next round'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
