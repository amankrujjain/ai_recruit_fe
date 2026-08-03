import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TablePagination({ pagination, onPageChange }) {
  if (!pagination || pagination.total === 0) return null;

  const { page, totalPages, total, limit } = pagination;
  const pageSize = limit || pagination.pageSize || 10;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted">
        Showing <span className="font-medium text-foreground">{from}</span> to{' '}
        <span className="font-medium text-foreground">{to}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> results
      </p>

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/25'
                  : 'border border-border text-foreground hover:bg-brand-50 hover:text-brand-700'
              )}
            >
              {p}
            </button>
          ))}

          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-brand-50 hover:text-brand-700 disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
