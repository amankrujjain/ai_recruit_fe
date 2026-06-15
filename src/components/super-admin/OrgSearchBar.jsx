import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export function OrgSearchBar({ value, onChange }) {
  return (
    <div className="relative max-w-sm">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search organizations..."
        className="pl-9"
      />
    </div>
  );
}
