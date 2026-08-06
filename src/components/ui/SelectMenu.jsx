import { forwardRef } from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SelectRoot = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 text-sm text-foreground',
      'shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50/40',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[placeholder]:text-muted',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

export const SelectContent = forwardRef(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      sideOffset={6}
      className={cn(
        'z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-slate-900/10',
        className
      )}
      {...props}
    >
      <SelectPrimitive.Viewport className="p-1.5">
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

export const SelectItem = forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2 pl-3 pr-8 text-sm text-foreground outline-none',
      'transition-colors hover:bg-brand-50 focus:bg-brand-50',
      'data-[highlighted]:bg-brand-50 data-[highlighted]:text-brand-700',
      'data-[state=checked]:font-semibold data-[state=checked]:text-brand-700',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <span className="absolute right-2 flex h-4 w-4 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-brand-600" />
      </SelectPrimitive.ItemIndicator>
    </span>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const ALL_VALUE = '__all__';

/**
 * Filter-friendly select: value "" means "all".
 * options: [{ value, label }]
 */
export function FilterSelect({
  value = '',
  onValueChange,
  options = [],
  placeholder = 'Select…',
  allLabel,
  className,
  disabled = false,
}) {
  const items = allLabel != null
    ? [{ value: ALL_VALUE, label: allLabel }, ...options]
    : options;

  const radixValue = value === '' || value == null ? ALL_VALUE : value;

  const handleChange = (next) => {
    onValueChange?.(next === ALL_VALUE ? '' : next);
  };

  return (
    <SelectRoot value={radixValue} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((opt) => (
          <SelectItem key={opt.value || ALL_VALUE} value={opt.value || ALL_VALUE}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}
