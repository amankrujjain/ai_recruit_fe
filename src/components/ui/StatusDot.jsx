import { cn } from '@/lib/utils';
import { userStatusLabel, userStatusVariant } from '@/lib/userStatus';

const dotColors = {
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  muted: 'bg-slate-400',
  default: 'bg-brand-500',
  danger: 'bg-red-500',
};

const pillStyles = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  muted: 'bg-slate-100 text-slate-600',
  default: 'bg-brand-50 text-brand-700',
  danger: 'bg-red-50 text-red-700',
};

export function StatusDot({ status }) {
  const variant = userStatusVariant[status] || 'muted';
  const label = userStatusLabel[status] || status;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        pillStyles[variant]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />
      {label}
    </span>
  );
}

