import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const STATUS_LABELS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  RESOLVED: 'Resolved',
};

const statusBadgeVariant = (status) => {
  if (status === 'RESOLVED') return 'success';
  if (status === 'IN_PROGRESS') return 'warning';
  return 'default';
};

export function MyTicketDetailModal({ open, onOpenChange, ticket }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !ticket || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={() => onOpenChange?.(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={titleId} className="text-xl font-semibold text-foreground">
                {ticket.ticketNumber}
              </h2>
              <Badge variant={statusBadgeVariant(ticket.status)}>
                {STATUS_LABELS[ticket.status] || ticket.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{ticket.subject}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-foreground"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 rounded-xl border border-border bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted">Category</p>
              <p className="mt-1 font-medium text-foreground">
                {ticket.category?.name || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Created</p>
              <p className="mt-1 font-medium text-foreground">
                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—'}
              </p>
            </div>
            {ticket.status === 'RESOLVED' && ticket.resolvedAt && (
              <div className="sm:col-span-2">
                <p className="text-xs font-medium text-muted">Resolved</p>
                <p className="mt-1 font-medium text-foreground">
                  {new Date(ticket.resolvedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Description</p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
              {ticket.description}
            </p>
          </div>

          {ticket.resolutionNote && (
            <div>
              <p className="text-sm font-medium text-foreground">Resolution note</p>
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-emerald-50/60 p-4 text-sm leading-relaxed text-foreground">
                {ticket.resolutionNote}
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
