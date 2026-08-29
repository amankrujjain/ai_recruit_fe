import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/utils';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
];

export function JobsListToolbar({ search, onSearchChange, statusFilter, onStatusFilterChange }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <SearchInput
        value={search}
        onChange={onSearchChange}
        placeholder="Search jobs…"
        className="w-full sm:max-w-[220px]"
      />
      <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Job status filter">
        {FILTERS.map((filter) => {
          const selected = statusFilter === filter.id;
          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onStatusFilterChange(filter.id)}
              aria-pressed={selected}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                selected
                  ? 'bg-brand-600 text-white'
                  : 'bg-transparent text-muted hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
