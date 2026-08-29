import { Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * Floating multi-select bar — primary path for bulk "Invite to AI interview".
 */
export function CandidatesSelectionBar({
  selectedCount,
  onClear,
  onInvite,
  inviting,
}) {
  if (!selectedCount) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-white shadow-xl',
          'ring-1 ring-white/10'
        )}
      >
        <span className="text-sm font-medium tabular-nums">
          {selectedCount} selected
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-slate-200 hover:bg-white/10 hover:text-white"
          onClick={onClear}
        >
          <X className="mr-1 h-3.5 w-3.5" aria-hidden />
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={inviting}
          onClick={onInvite}
        >
          <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          {inviting ? 'Inviting…' : 'Invite to AI interview'}
        </Button>
      </div>
    </div>
  );
}
