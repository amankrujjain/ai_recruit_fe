import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatAuditIp } from '@/lib/formatAuditIp';
import {
  formatAuditTime,
  getActionLabel,
  getModuleMeta,
  deriveStatus,
} from '@/lib/auditLog';

export function AuditLogDetailModal({ open, onOpenChange, log }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onOpenChange?.(false);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || !log || typeof document === 'undefined') return null;

  const status = deriveStatus(log);
  const moduleMeta = getModuleMeta(log.module);
  const ModuleIcon = moduleMeta.icon;
  const account = log.account;
  const metadataJson = (() => {
    try {
      return JSON.stringify(log.metadata ?? {}, null, 2);
    } catch {
      return '{}';
    }
  })();

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
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/25"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onOpenChange?.(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-50 hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-8">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Activity details
          </h2>
          <p className="mt-1 text-sm text-muted">{formatAuditTime(log.createdAt)}</p>
        </div>

        <div className="mt-5 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface/60 p-3">
            <Avatar
              firstName={account?.firstName}
              lastName={account?.lastName}
              className="h-10 w-10"
            />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {account
                  ? `${account.firstName || ''} ${account.lastName || ''}`.trim() || 'Unknown user'
                  : 'System / unknown'}
              </p>
              <p className="truncate text-xs text-muted">{account?.email || '—'}</p>
            </div>
            <Badge variant={status === 'failed' ? 'danger' : 'success'} className="ml-auto shrink-0">
              {status === 'failed' ? 'Failed' : 'Success'}
            </Badge>
          </div>

          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-muted">Action</dt>
              <dd className="mt-0.5 font-medium text-foreground">{getActionLabel(log.action)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Module</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 font-medium text-foreground">
                <ModuleIcon className="h-3.5 w-3.5 text-brand-500" />
                {moduleMeta.label}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Resource</dt>
              <dd className="mt-0.5 text-foreground">{log.resource || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Resource ID</dt>
              <dd className="mt-0.5 truncate font-mono text-xs text-muted">{log.resourceId || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">IP Address</dt>
              <dd className="mt-0.5 font-mono text-xs text-foreground">{formatAuditIp(log) || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted">User Agent</dt>
              <dd className="mt-0.5 break-all text-xs text-muted">{log.userAgent || '—'}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted">Metadata</dt>
              <dd className="mt-1 overflow-x-auto rounded-lg border border-border bg-slate-50 p-3">
                <pre className="text-xs text-foreground">{metadataJson}</pre>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>,
    document.body
  );
}
