import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserStatus } from '@/lib/userStatus';
import {
  deleteRecruiter,
  disableRecruiter,
  enableRecruiter,
  resetRecruiterPassword,
  selectRecruiters,
} from '@/store/slices/recruitersSlice';

export function RecruiterRowActions({ recruiter }) {
  const dispatch = useDispatch();
  const { actionId } = useSelector(selectRecruiters);
  const busy = actionId === recruiter.accountId;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const run = async (action, label) => {
    const result = await dispatch(action(recruiter.accountId));
    if (action.fulfilled.match(result)) toast.success(label);
    else toast.error(result.payload || 'Action failed');
  };

  const handleDeleteConfirm = async () => {
    await run(deleteRecruiter, 'Recruiter deleted');
    setConfirmOpen(false);
  };

  return (
    <div className="flex flex-wrap gap-1">
      {recruiter.status === UserStatus.ACTIVE && (
        <>
          <Button variant="outline" size="sm" onClick={() => run(disableRecruiter, 'Recruiter disabled')}>
            Disable
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => run(resetRecruiterPassword, 'Password reset email sent')}
          >
            Reset pwd
          </Button>
        </>
      )}
      {recruiter.status === UserStatus.DISABLED && (
        <Button variant="outline" size="sm" onClick={() => run(enableRecruiter, 'Recruiter enabled')}>
          Enable
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>Delete</Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete recruiter?"
        description={`Delete ${recruiter.email}? This will deactivate their access.`}
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
