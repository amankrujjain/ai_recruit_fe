import { Button } from '@/components/ui/Button';

export function SelectCandidatesBar({ selectedCount, selecting, onSelect }) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
      <p className="text-sm font-medium text-brand-800">
        {selectedCount} candidate{selectedCount === 1 ? '' : 's'} selected
      </p>
      <Button size="sm" disabled={selecting} onClick={onSelect}>
        {selecting ? 'Selecting…' : 'Select for outreach'}
      </Button>
    </div>
  );
}
