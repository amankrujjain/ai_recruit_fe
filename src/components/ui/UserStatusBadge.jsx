import { Badge } from '@/components/ui/Badge';
import { userStatusLabel, userStatusVariant } from '@/lib/userStatus';

export function UserStatusBadge({ status }) {
  return (
    <Badge variant={userStatusVariant[status] || 'muted'}>
      {userStatusLabel[status] || status}
    </Badge>
  );
}
