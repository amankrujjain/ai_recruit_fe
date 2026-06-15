import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function OrgTable({ items, loading }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Organizations</h2>
        <p className="text-sm text-muted">All agencies onboarded on the platform.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted">Loading organizations...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No organizations yet. Create your first one above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Users</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr key={org.organizationId} className="border-b border-border/60">
                  <td className="py-3 font-medium">{org.organizationName}</td>
                  <td className="py-3 text-muted">
                    {[org.city, org.country?.name].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-3">
                    <Badge variant="default">{org._count?.users ?? 0}</Badge>
                  </td>
                  <td className="py-3 text-muted">{formatDate(org.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
