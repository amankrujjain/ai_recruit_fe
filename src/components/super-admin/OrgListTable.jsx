import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export function OrgListTable({ items, loading, onSelect }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Verified organizations</h2>
        <p className="text-sm text-muted">Active organizations on the platform.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No organizations found.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Users</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {items.map((org) => (
                <tr
                  key={org.organizationId}
                  className="cursor-pointer border-b border-border/60 hover:bg-brand-50/50"
                  onClick={() => onSelect?.(org.organizationId)}
                >
                  <td className="py-3 font-medium">{org.organizationName}</td>
                  <td className="py-3 text-muted">
                    {[org.city, org.country?.name].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-3">
                    <Badge>{org._count?.users ?? 0}</Badge>
                  </td>
                  <td className="py-3">
                    <Badge variant={org.isActive ? 'success' : 'muted'}>
                      {org.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
