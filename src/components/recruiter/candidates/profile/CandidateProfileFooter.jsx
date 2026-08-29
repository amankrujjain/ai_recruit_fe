import { Button } from '@/components/ui/Button';

export function CandidateProfileFooter({
  saving,
  onInviteNext,
  onMarkSelected,
  onReject,
  onHire,
}) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex w-full max-w-8xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Org allows 3 rounds — invite to next when ready. Multi-round invites coming soon.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            title="Multi-round invites are not available yet"
            onClick={onInviteNext}
          >
            Invite to next round
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={onMarkSelected}
          >
            Mark selected
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
            variant="ghost"
            size="sm"
            disabled={saving}
            onClick={onHire}
          >
            Hire
          </Button>
        </div>
      </div>
    </div>
  );
}
