import { Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function InviteHrCta({ onInvite }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
          <Mail className="h-6 w-6" />
        </span>
        <div>
          <h3 className="font-semibold text-foreground">Invite HR Members</h3>
          <p className="mt-0.5 max-w-xl text-sm text-muted">
            Invitees will receive an email with a link to set up their account and join your
            organization on RecruitAI.
          </p>
        </div>
      </div>
      <Button onClick={onInvite} className="shrink-0">
        <UserPlus className="mr-2 h-4 w-4" />
        Invite HR Member
      </Button>
    </div>
  );
}
