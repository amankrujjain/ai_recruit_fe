import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPasswordChecks } from '@/lib/passwordRules';

export function PasswordStrengthRules({ password, className }) {
  const checks = getPasswordChecks(password);

  return (
    <ul className={cn('space-y-1.5 rounded-lg border border-border bg-surface/60 p-3', className)}>
      {checks.map((rule) => (
        <li
          key={rule.id}
          className={cn(
            'flex items-center gap-2 text-xs transition-colors',
            rule.passed ? 'text-emerald-600' : 'text-muted'
          )}
        >
          {rule.passed ? (
            <Check className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <Circle className="h-3.5 w-3.5 shrink-0" />
          )}
          <span>{rule.label}</span>
        </li>
      ))}
    </ul>
  );
}
