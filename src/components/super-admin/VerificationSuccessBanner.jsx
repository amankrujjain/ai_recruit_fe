import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  clearLastRegistration,
  selectRegistrations,
} from '@/store/slices/registrationSlice';

export function VerificationSuccessBanner() {
  const dispatch = useDispatch();
  const { lastCreated } = useSelector(selectRegistrations);

  if (!lastCreated?.invitation) return null;

  const { registration, invitation } = lastCreated;
  const signupUrl = invitation.inviteUrl || '';

  const copyLink = async () => {
    await navigator.clipboard.writeText(signupUrl);
    toast.success('Verification link copied');
  };

  return (
    <div className="rounded-xl border border-accent-500/30 bg-emerald-50 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-emerald-800">
            {registration.organizationName} — pending verification
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Link sent to {invitation.email}
          </p>
          <p className="mt-2 break-all text-xs text-emerald-600">{signupUrl}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="mr-1 h-3.5 w-3.5" />
            Copy link
          </Button>
          <Button variant="ghost" size="sm" onClick={() => dispatch(clearLastRegistration())}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
