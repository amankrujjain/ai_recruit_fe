import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPipelineSteps } from '@/lib/candidatePipeline';

export function CandidatePipelineStepper({ candidateJob, hasScorecard }) {
  const steps = getPipelineSteps(candidateJob, { hasScorecard });

  return (
    <ol className="flex w-full items-start gap-0 overflow-x-auto pb-1">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const complete = step.state === 'complete';
        const current = step.state === 'current';

        return (
          <li key={step.id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              {index > 0 ? (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    complete || current ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold',
                  complete && 'border-emerald-500 bg-emerald-500 text-white',
                  current && !complete && 'border-brand-600 bg-brand-600 text-white',
                  current && complete && 'border-brand-600 bg-brand-600 text-white',
                  step.state === 'pending' && 'border-slate-200 bg-white text-slate-400'
                )}
              >
                {complete && !current ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : current ? (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                )}
              </span>
              {!isLast ? (
                <div
                  className={cn(
                    'h-0.5 flex-1',
                    complete ? 'bg-emerald-500' : 'bg-slate-200'
                  )}
                />
              ) : (
                <div className="flex-1" />
              )}
            </div>
            <p
              className={cn(
                'mt-2 max-w-[5.5rem] text-center text-[11px] font-medium leading-tight',
                current ? 'text-brand-700' : complete ? 'text-foreground' : 'text-muted'
              )}
            >
              {step.label}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
