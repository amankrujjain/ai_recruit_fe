import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function StatCard({ icon: Icon, label, value, trend, subtext, tone = 'brand' }) {
  const tones = {
    brand: 'bg-brand-50 text-brand-500',
    success: 'bg-success-500/10 text-success-600',
    warning: 'bg-warning-500/10 text-warning-500',
    danger: 'bg-red-50 text-red-600',
    accent: 'bg-brand-50 text-brand-500',
  };

  return (
    <Card className="p-5">
      <div className="flex items-start gap-4">
        <span className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', tones[tone])}>
          {Icon && <Icon className="h-6 w-6" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-muted">{label}</p>
          <p className="mt-1 text-3xl font-bold leading-none text-foreground">{value}</p>
          {trend != null ? (
            <p className="mt-2 flex items-center gap-1 text-xs font-medium text-success-600">
              <TrendingUp className="h-3.5 w-3.5" />
              {trend} this month
            </p>
          ) : (
            <p className="mt-2 text-xs text-muted">{subtext}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
