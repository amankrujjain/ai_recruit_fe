import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
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

  const run = async (action, label) => {
    const result = await dispatch(action(recruiter.accountId));
    if (action.fulfilled.match(result)) toast.success(label);
    else toast.error(result.payload || 'Action failed');
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${recruiter.email}?`)) return;
    await run(deleteRecruiter, 'Recruiter deleted');
  };

  return (
    <div className="flex flex-wrap gap-1">
      {recruiter.status === UserStatus.ACTIVE && (
        <>
          <Button variant="outline" size="sm" onClick={() => run(disableRecruiter, 'Recruiter disabled')}>
            Disable
          </Button>
          <Button variant="outline" size="sm" disabled={busy}
            onClick={() => run(resetRecruiterPassword, 'Password reset email sent')}>
            Reset pwd
          </Button>
        </>
      )}
      {recruiter.status === UserStatus.DISABLED && (
        <Button variant="outline" size="sm" onClick={() => run(enableRecruiter, 'Recruiter enabled')}>
          Enable
        </Button>
      )}
      <Button variant="ghost" size="sm" onClick={handleDelete}>Delete</Button>
    </div>
  );
}
