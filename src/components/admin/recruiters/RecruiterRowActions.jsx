import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Eye, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { deleteRecruiter, selectRecruiters } from '@/store/slices/recruitersSlice';
import { ViewRecruiterModal } from '@/components/admin/recruiters/ViewRecruiterModal';

export function RecruiterRowActions({ recruiter }) {
  const dispatch = useDispatch();
  const { actionId } = useSelector(selectRecruiters);
  const busy = actionId === recruiter.accountId;
  const [viewOpen, setViewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleDeleteConfirm = async () => {
    const result = await dispatch(deleteRecruiter(recruiter.accountId));
    if (deleteRecruiter.fulfilled.match(result)) toast.success('HR member deleted');
    else toast.error(result.payload || 'Failed to delete');
    setConfirmOpen(false);
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <button
        type="button"
        onClick={() => setViewOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
        aria-label="View HR member"
      >
        <Eye className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-red-50 hover:text-red-600"
        aria-label="Delete HR member"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <ViewRecruiterModal
        open={viewOpen}
        onOpenChange={setViewOpen}
        recruiter={recruiter}
      />

      <ConfirmDialog
        open={confirmOpen}
        title="Delete HR member?"
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
