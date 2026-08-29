import { Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

const STAGES = [
  { key: 'uploaded', label: 'Uploaded', bar: 'bg-brand-500' },
  { key: 'eligible', label: 'Eligible ≥80%', bar: 'bg-brand-400' },
  { key: 'outreachSent', label: 'Outreach sent', bar: 'bg-violet-400' },
  { key: 'scheduled', label: 'Scheduled', bar: 'bg-amber-400' },
  { key: 'scored', label: 'Scored', bar: 'bg-teal-500' },
  { key: 'selected', label: 'Selected', bar: 'bg-emerald-500' },
];

export function PipelineFunnelCard({ funnel, matchThreshold = 80 }) {
  const max = Math.max(1, ...(STAGES.map((s) => funnel?.[s.key] || 0)));

  return (
    <Card>
      <CardContent className="space-y-4 pt-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pipeline funnel</h3>
          <p className="text-xs text-muted">Across all active jobs</p>
        </div>
        <ul className="space-y-3">
          {STAGES.map((stage) => {
            const value = funnel?.[stage.key] ?? 0;
            const width = `${Math.max(8, Math.round((value / max) * 100))}%`;
            return (
              <li key={stage.key}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted">
                    {stage.key === 'eligible' ? `Eligible ≥${matchThreshold}%` : stage.label}
                  </span>
                  <span className="font-semibold text-foreground">{value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn('h-full rounded-full', stage.bar)} style={{ width }} />
                </div>
              </li>
            );
          })}
        </ul>
        <p className="flex items-start gap-1.5 text-[11px] leading-snug text-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Eligible counts candidates with match score at or above {matchThreshold}%.
        </p>
      </CardContent>
    </Card>
  );
}
