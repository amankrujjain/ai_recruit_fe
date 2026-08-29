import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Role details' },
  { id: 2, label: 'AI round setup' },
  { id: 3, label: 'Review & publish' },
];

export function CreateJobStepper({ currentStep }) {
  return (
    <nav aria-label="Create job steps" className="mb-6">
      <ol className="flex flex-wrap items-center gap-2 sm:gap-0">
        {STEPS.map((step, index) => {
          const done = currentStep > step.id;
          const active = currentStep === step.id;
          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                    done && 'bg-brand-600 text-white',
                    active && 'bg-brand-600 text-white',
                    !done && !active && 'bg-slate-100 text-muted'
                  )}
                  aria-current={active ? 'step' : undefined}
                >
                  {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : step.id}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    active || done ? 'text-foreground' : 'text-muted'
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  className="mx-3 hidden h-px w-8 bg-border sm:block"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
