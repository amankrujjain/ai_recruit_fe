import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { UserStatus } from '@/lib/userStatus';
import { relativeTime } from '@/lib/relativeTime';
import { getRoleLabel } from '@/lib/roles';
import {
  disableRecruiter,
  enableRecruiter,
  resetRecruiterPassword,
  selectRecruiters,
} from '@/store/slices/recruitersSlice';

export function ViewRecruiterModal({ open, onOpenChange, recruiter }) {
  const dispatch = useDispatch();
  const { actionId } = useSelector(selectRecruiters);
  const busy = actionId === recruiter?.accountId;
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

  if (!open || !recruiter || typeof document === 'undefined') return null;

  const run = async (action, label) => {
    const result = await dispatch(action(recruiter.accountId));
    if (action.fulfilled.match(result)) toast.success(label);
    else toast.error(result.payload || 'Action failed');
  };

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
        className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/25"
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

        <div className="flex items-center gap-3 pr-8">
          <Avatar firstName={recruiter.firstName} lastName={recruiter.lastName} className="h-12 w-12 text-sm" />
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {recruiter.firstName} {recruiter.lastName}
            </h2>
            <p className="text-sm text-muted">{recruiter.email}</p>
          </div>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Status</dt>
            <dd><StatusDot status={recruiter.status} /></dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Last login</dt>
            <dd className="font-medium text-foreground">{relativeTime(recruiter.lastLogin)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Department</dt>
            <dd className="text-foreground">—</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Role</dt>
            <dd className="text-foreground">{getRoleLabel(recruiter.role) || 'Recruiter'}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-2">
          {recruiter.status === UserStatus.ACTIVE && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => run(disableRecruiter, 'HR member disabled')}
              >
                Disable
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => run(resetRecruiterPassword, 'Password reset email sent')}
              >
                Reset password
              </Button>
            </>
          )}
          {recruiter.status === UserStatus.DISABLED && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => run(enableRecruiter, 'HR member enabled')}
            >
              Enable
            </Button>
          )}
          <Button variant="ghost" size="sm" className="ml-auto" onClick={() => onOpenChange?.(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
