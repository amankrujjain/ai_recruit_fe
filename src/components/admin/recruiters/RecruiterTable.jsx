import { Avatar } from '@/components/ui/Avatar';
import { StatusDot } from '@/components/ui/StatusDot';
import { RecruiterRowActions } from '@/components/admin/recruiters/RecruiterRowActions';
import { relativeTime } from '@/lib/relativeTime';
import { getRoleLabel } from '@/lib/roles';

export function RecruiterTable({ items, loading }) {
  if (loading && items.length === 0) {
    return <p className="py-8 text-center text-sm text-muted">Loading HR members...</p>;
  }
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No HR members yet. Invite your first team member.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="pb-3 pr-4 font-medium">HR Member</th>
            <th className="pb-3 pr-4 font-medium">Department</th>
            <th className="pb-3 pr-4 font-medium">Designation</th>
            <th className="pb-3 pr-4 font-medium">Email</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="pb-3 pr-4 font-medium">Last Login</th>
            <th className="pb-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => {
            const roleLabel = getRoleLabel(r.role) || 'Recruiter';
            return (
            <tr key={r.accountId} className="border-b border-border/60 last:border-0">
              <td className="py-3.5 pr-4">
                <div className="flex items-center gap-3">
                  <Avatar firstName={r.firstName} lastName={r.lastName} />
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-foreground">
                      {r.firstName} {r.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">{roleLabel}</p>
                  </div>
                </div>
              </td>
              {/* Department: set when admin department flow ships */}
              <td className="py-3.5 pr-4 text-muted">—</td>
              <td className="py-3.5 pr-4 text-muted">{roleLabel}</td>
              <td className="py-3.5 pr-4 text-muted">{r.email}</td>
              <td className="py-3.5 pr-4">
                <StatusDot status={r.status} />
              </td>
              <td className="py-3.5 pr-4 text-muted">{relativeTime(r.lastLogin)}</td>
              <td className="py-3.5">
                <RecruiterRowActions recruiter={r} />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
