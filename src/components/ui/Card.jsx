import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-2xl border border-border bg-card shadow-xl shadow-brand-600/5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }) {
  return <div className={cn('p-6 pb-2', className)}>{children}</div>;
}

export function CardContent({ className, children }) {
  return <div className={cn('p-6 pt-2', className)}>{children}</div>;
}
