import { UserStatusBadge } from '@/components/ui/UserStatusBadge';
import { RecruiterRowActions } from '@/components/admin/recruiters/RecruiterRowActions';

function formatDate(v) {
  return v ? new Date(v).toLocaleString() : '—';
}

export function RecruiterTable({ items, loading }) {
  if (loading && items.length === 0) {
    return <p className="text-sm text-muted">Loading recruiters...</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted">No recruiters yet. Invite your first team member.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="pb-3 font-medium">Name</th>
            <th className="pb-3 font-medium">Email</th>
            <th className="pb-3 font-medium">Status</th>
            <th className="pb-3 font-medium">Last login</th>
            <th className="pb-3 font-medium">Joined</th>
            <th className="pb-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.accountId} className="border-b border-border/60">
              <td className="py-3 font-medium">{r.firstName} {r.lastName}</td>
              <td className="py-3 text-muted">{r.email}</td>
              <td className="py-3"><UserStatusBadge status={r.status} /></td>
              <td className="py-3 text-muted">{formatDate(r.lastLogin)}</td>
              <td className="py-3 text-muted">{formatDate(r.createdAt)}</td>
              <td className="py-3"><RecruiterRowActions recruiter={r} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
