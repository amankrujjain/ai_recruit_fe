import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CategoryFaqModal({ open, onOpenChange, category, faqs = [] }) {
  const titleId = useId();
  const [openFaqId, setOpenFaqId] = useState(null);

  useEffect(() => {
    if (!open) {
      setOpenFaqId(null);
      return undefined;
    }

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

  if (!open || !category || typeof document === 'undefined') return null;

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
        className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div>
            <h2 id={titleId} className="text-xl font-semibold text-foreground">
              {category.name}
            </h2>
            {category.description && (
              <p className="mt-1 text-sm text-muted">{category.description}</p>
            )}
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

        <div className="overflow-y-auto px-6 py-4">
          {faqs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No FAQs are available in this category yet.
            </p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border">
              {faqs.map((faq) => {
                const isOpen = openFaqId === faq.faqId;
                return (
                  <div key={faq.faqId}>
                    <button
                      type="button"
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/50"
                      onClick={() => setOpenFaqId(isOpen ? null : faq.faqId)}
                      aria-expanded={isOpen}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{faq.question}</p>
                        {faq.shortDescription && (
                          <p className="mt-0.5 text-sm text-muted">{faq.shortDescription}</p>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'mt-1 h-4 w-4 shrink-0 text-muted transition-transform',
                          isOpen && 'rotate-180'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-border bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
