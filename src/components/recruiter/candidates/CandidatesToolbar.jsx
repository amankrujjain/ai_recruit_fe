import { Button } from '@/components/ui/Button';

export function CandidatesToolbar({
  selectAllEligibleChecked,
  onToggleSelectAllEligible,
  eligibleCount,
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" className="pointer-events-none opacity-90">
        Sort: Match ↓
      </Button>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="rounded border-border"
          checked={selectAllEligibleChecked}
          onChange={(e) => onToggleSelectAllEligible?.(e.target.checked)}
          disabled={eligibleCount === 0}
        />
        Select all eligible
      </label>
    </div>
  );
}
