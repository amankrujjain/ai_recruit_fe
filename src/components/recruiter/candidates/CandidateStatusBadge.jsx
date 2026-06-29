import { Badge } from '@/components/ui/Badge';
import {
  candidateStatusLabels,
  candidateStatusVariants,
} from '@/lib/candidateStatus';

export function CandidateStatusBadge({ status }) {
  if (!status) return <Badge variant="muted">—</Badge>;
  return (
    <Badge variant={candidateStatusVariants[status] || 'muted'}>
      {candidateStatusLabels[status] || status}
    </Badge>
  );
}
