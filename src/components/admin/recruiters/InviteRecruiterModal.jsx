import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { inviteRecruiter, selectRecruiters } from '@/store/slices/recruitersSlice';

const empty = { firstName: '', lastName: '', email: '', department: '', designation: '' };

export function InviteRecruiterModal({ open, onOpenChange, onInvited }) {
  const dispatch = useDispatch();
  const { inviting } = useSelector(selectRecruiters);
  const [form, setForm] = useState(empty);
  const titleId = useId();

  const close = () => {
    if (inviting) return;
    onOpenChange?.(false);
  };

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !inviting) onOpenChange?.(false);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, inviting, onOpenChange]);

  useEffect(() => {
    if (open) setForm(empty);
  }, [open]);

  const onChange = (field) => (e) => setForm((s) => ({ ...s, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO(api): department/designation not supported by invite endpoint yet.
    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
    };
    const result = await dispatch(inviteRecruiter(payload));
    if (inviteRecruiter.fulfilled.match(result)) {
      toast.success('Invitation sent to HR member');
      setForm(empty);
      onOpenChange?.(false);
      onInvited?.();
    } else {
      toast.error(result.payload || 'Failed to invite HR member');
    }
  };

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
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/25"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          disabled={inviting}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-50 hover:text-foreground disabled:opacity-50"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="pr-8">
          <h2 id={titleId} className="text-lg font-semibold text-foreground">
            Invite HR Member
          </h2>
          <p className="mt-1 text-sm text-muted">
            They will receive an email to set up their account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invite-first">First name</Label>
            <Input
              id="invite-first"
              value={form.firstName}
              onChange={onChange('firstName')}
              required
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-last">Last name</Label>
            <Input
              id="invite-last"
              value={form.lastName}
              onChange={onChange('lastName')}
              required
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={onChange('email')}
              required
            />
          </div>
          {/* TODO(api): department/designation not stored by backend yet */}
          <div className="space-y-2">
            <Label htmlFor="invite-dept">Department</Label>
            <Input
              id="invite-dept"
              value={form.department}
              onChange={onChange('department')}
              placeholder="Optional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-desig">Designation</Label>
            <Input
              id="invite-desig"
              value={form.designation}
              onChange={onChange('designation')}
              placeholder="Optional"
            />
          </div>

          <div className="flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" disabled={inviting} onClick={close}>
              Cancel
            </Button>
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Sending…' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
