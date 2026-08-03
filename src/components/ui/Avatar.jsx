import { cn } from '@/lib/utils';

export function Avatar({ firstName, lastName, className }) {
  const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || '?';

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700',
        className
      )}
      aria-hidden
    >
      {initials}
    </span>
  );
}
