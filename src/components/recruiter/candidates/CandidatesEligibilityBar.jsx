import { SlidersHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { DEFAULT_ELIGIBILITY_THRESHOLD } from '@/lib/candidateEligibility';

export function CandidatesEligibilityBar({
  threshold = DEFAULT_ELIGIBILITY_THRESHOLD,
  onThresholdChange,
  eligibleCount = 0,
  totalCount = 0,
}) {
  const pct = Math.min(100, Math.max(50, Number(threshold) || DEFAULT_ELIGIBILITY_THRESHOLD));
  // Map 50–100 onto 0–100 fill width for the visual track
  const fillPct = ((pct - 50) / 50) * 100;

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 sm:gap-3">
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden />
          <span className="text-sm text-foreground">Show as eligible if match ≥</span>
          <span className="text-sm font-semibold text-brand-600 tabular-nums">{pct}%</span>
          <div className="relative flex h-4 w-full max-w-[200px] items-center">
            <div className="absolute inset-x-0 h-2 rounded-full bg-slate-200" />
            <div
              className="absolute left-0 h-2 rounded-full bg-brand-500"
              style={{ width: `${fillPct}%` }}
            />
            <span
              className="pointer-events-none absolute top-1/2 z-[1] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-600 bg-white shadow-sm"
              style={{ left: `${fillPct}%` }}
            />
            <input
              type="range"
              min={50}
              max={100}
              step={1}
              value={pct}
              onChange={(e) => onThresholdChange?.(Number(e.target.value))}
              className="absolute inset-0 z-10 w-full cursor-pointer appearance-none bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
              aria-label="Eligibility match threshold"
            />
          </div>
        </div>
        <p className="shrink-0 text-sm text-muted tabular-nums">
          {eligibleCount} of {totalCount} eligible
        </p>
      </CardContent>
    </Card>
  );
}
