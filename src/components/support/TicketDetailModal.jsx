import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FilterSelect } from '@/components/ui/SelectMenu';
import {
  clearSupportError,
  selectSupport,
  updateTicketStatus,
} from '@/store/slices/supportSlice';

const STATUS_OPTIONS = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
];

const statusBadgeVariant = (status) => {
  if (status === 'RESOLVED') return 'success';
  if (status === 'IN_PROGRESS') return 'warning';
  return 'default';
};

const formatStatus = (status) =>
  STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;

export function TicketDetailModal({ open, onOpenChange, ticket, listParams }) {
  const titleId = useId();
  const dispatch = useDispatch();
  const { ticketSaving, error } = useSelector(selectSupport);
  const [status, setStatus] = useState('OPEN');
  const [resolutionNote, setResolutionNote] = useState('');

  useEffect(() => {
    if (!ticket) return;
    setStatus(ticket.status || 'OPEN');
    setResolutionNote(ticket.resolutionNote || '');
  }, [ticket]);

  useEffect(() => {
    if (!open) {
      dispatch(clearSupportError());
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !ticketSaving) onOpenChange?.(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange, ticketSaving, dispatch]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!ticket) return;

    const result = await dispatch(updateTicketStatus({
      ticketId: ticket.ticketId,
      payload: {
        status,
        resolutionNote: resolutionNote.trim(),
      },
      listParams,
    }));

    if (updateTicketStatus.fulfilled.match(result)) {
      toast.success('Ticket updated');
      onOpenChange?.(false);
    }
  };

  if (!open || !ticket || typeof document === 'undefined') return null;

  const raiserName = ticket.raisedBy
    ? `${ticket.raisedBy.firstName || ''} ${ticket.raisedBy.lastName || ''}`.trim()
    : '—';

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={() => {
          if (!ticketSaving) onOpenChange?.(false);
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 id={titleId} className="text-xl font-semibold text-foreground">
                {ticket.ticketNumber}
              </h2>
              <Badge variant={statusBadgeVariant(ticket.status)}>
                {formatStatus(ticket.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted">{ticket.subject}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            disabled={ticketSaving}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-slate-100 hover:text-foreground disabled:opacity-50"
            onClick={() => onOpenChange?.(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="space-y-5 overflow-y-auto px-6 py-5" onSubmit={handleSubmit}>
          <div className="grid gap-3 rounded-xl border border-border bg-slate-50/60 p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted">Organization</p>
              <p className="mt-1 font-medium text-foreground">
                {ticket.organization?.organizationName || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted">Raised by</p>
              <p className="mt-1 font-medium text-foreground">{raiserName || '—'}</p>
            </div>
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
          </div>

          <div>
            <p className="text-sm font-medium text-foreground">Description</p>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground">
              {ticket.description}
            </p>
          </div>

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Status
            <FilterSelect
              value={status}
              onValueChange={setStatus}
              options={STATUS_OPTIONS}
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Resolution note
            <textarea
              className="min-h-24 w-full rounded-lg border border-border bg-card p-3 text-sm font-normal"
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              placeholder="Optional note for the raiser / internal tracking"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={ticketSaving}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={ticketSaving}>
              {ticketSaving ? 'Saving...' : 'Update ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
