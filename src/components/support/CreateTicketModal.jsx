import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FilterSelect } from '@/components/ui/SelectMenu';
import {
  clearSupportError,
  createTicket,
  selectSupport,
} from '@/store/slices/supportSlice';

const emptyForm = {
  subject: '',
  categoryId: '',
  description: '',
};

export function CreateTicketModal({ open, onOpenChange, categories = [] }) {
  const titleId = useId();
  const dispatch = useDispatch();
  const { ticketSaving, error } = useSelector(selectSupport);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (!open) {
      setForm(emptyForm);
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

  const categoryOptions = categories.map((category) => ({
    value: category.categoryId,
    label: category.name,
  }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const result = await dispatch(createTicket({
      subject: form.subject.trim(),
      categoryId: form.categoryId,
      description: form.description.trim(),
    }));
    if (createTicket.fulfilled.match(result)) {
      toast.success(`Ticket ${result.payload.ticketNumber} created`);
      onOpenChange?.(false);
    }
  };

  if (!open || typeof document === 'undefined') return null;

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
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-foreground">
              Create Support Ticket
            </h2>
            <p className="mt-1 text-sm text-muted">
              Describe your issue and our team will follow up.
            </p>
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

        <form className="space-y-4 overflow-y-auto px-6 py-5" onSubmit={handleSubmit}>
          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Subject
            <Input
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              placeholder="Brief summary of the issue"
              minLength={3}
              maxLength={200}
              required
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Category
            <FilterSelect
              value={form.categoryId}
              onValueChange={(value) => setForm({ ...form, categoryId: value })}
              options={categoryOptions}
              placeholder="Select a category"
            />
          </label>

          <label className="block space-y-1.5 text-sm font-medium text-foreground">
            Description
            <textarea
              className="min-h-28 w-full rounded-lg border border-border bg-card p-3 text-sm font-normal"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Provide as much detail as possible..."
              minLength={10}
              required
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              disabled={ticketSaving}
              onClick={() => onOpenChange?.(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={ticketSaving || !form.categoryId}>
              {ticketSaving ? 'Submitting...' : 'Submit Ticket'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
