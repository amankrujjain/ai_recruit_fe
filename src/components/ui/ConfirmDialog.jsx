import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Reusable confirm / alert dialog.
 *
 * Props: open, title, description, children, confirmLabel, cancelLabel,
 * variant ('default' | 'danger'), loading, hideCancel,
 * onConfirm, onCancel, onOpenChange(false)
 *
 * Closes via: X, Escape, or click on translucent overlay.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  loading = false,
  hideCancel = false,
  onConfirm,
  onCancel,
  onOpenChange,
}) {
  const titleId = useId();
  const descriptionId = useId();

  const close = () => {
    if (loading) return;
    onOpenChange?.(false);
    onCancel?.();
  };

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) {
        onOpenChange?.(false);
        onCancel?.();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, loading, onOpenChange, onCancel]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        aria-label="Close dialog overlay"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
        onClick={close}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          disabled={loading}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-50 hover:text-foreground disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-8">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          {description ? (
            <p id={descriptionId} className="mt-2 text-sm leading-relaxed text-muted">
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-3 text-sm text-foreground">{children}</div> : null}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {!hideCancel && (
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={close}>
              {cancelLabel}
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={loading}
            className={cn(variant === 'danger' && 'bg-red-600 shadow-red-600/25 hover:bg-red-700')}
            onClick={() => onConfirm?.()}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
