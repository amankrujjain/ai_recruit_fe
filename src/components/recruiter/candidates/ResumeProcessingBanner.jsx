import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress for resume parse + AI match (from status API).
 * percent is parse progress — not AI match score.
 */
export function ResumeProcessingBanner({ progress }) {
  if (!progress) return null;

  const {
    active,
    phase = 'parsing',
    fileName,
    percent = 0,
    completed = 0,
    failed = 0,
    total = 0,
    matched = 0,
    message,
    failedFiles = [],
  } = progress;

  const isDone = phase === 'done';
  const isFailed = phase === 'failed';
  const isScoring = phase === 'scoring';
  const showBar = active || isDone || isFailed;
  const barPercent = Math.max(
    0,
    Math.min(100, isDone || isFailed ? 100 : isScoring ? Math.max(percent, 85) : percent)
  );

  return (
    <div
      className={cn(
        'rounded-xl border p-4',
        isFailed && 'border-red-200 bg-red-50',
        isDone && 'border-emerald-200 bg-emerald-50',
        (active || isScoring) && 'border-brand-200 bg-brand-50/70'
      )}
      role="status"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
          {(active || isScoring) && (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-brand-600" />
          )}
          {isDone && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />}
          {isFailed && <XCircle className="h-4 w-4 shrink-0 text-red-600" />}
          <span className="truncate">{message || 'Processing resumes…'}</span>
        </div>
        {(active || isScoring) && !isScoring && (
          <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
            {barPercent}%
          </span>
        )}
      </div>

      {showBar && (
        <div className="h-2 overflow-hidden rounded-full bg-white/90">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isFailed ? 'bg-red-500' : isDone ? 'bg-emerald-500' : 'bg-brand-600'
            )}
            style={{ width: `${Math.max(barPercent, active || isScoring ? 4 : 0)}%` }}
          />
        </div>
      )}

      <p className="mt-2 text-xs text-muted">
        {isScoring ? 'Scoring progress' : 'Parsing progress'}
        {fileName ? ` · ${fileName}` : ''}
        {total > 0 ? ` · ${completed + failed}/${total} finished` : ''}
        {failed > 0 ? ` · ${failed} failed` : ''}
        {isScoring && completed > 0 ? ` · ${matched}/${completed} scored` : ''}
        {phase === 'parsing' && active
          ? ' · Match scores appear after scoring finishes'
          : ''}
      </p>

      {failedFiles.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-xs text-red-700">
          {failedFiles.map((f) => (
            <li key={f.resumeFileId || f.fileName}>
              <span className="font-medium">{f.fileName || 'File'}</span>
              {f.failureReason ? ` — ${f.failureReason}` : ''}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
