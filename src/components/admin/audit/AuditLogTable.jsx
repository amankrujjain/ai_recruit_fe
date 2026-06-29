import { formatAuditIp } from '@/lib/formatAuditIp';

export function AuditLogTable({ items, loading }) {
  if (loading && items.length === 0) {
    return <p className="text-sm text-muted">Loading audit logs...</p>;
  }
  if (items.length === 0) {
    return <p className="text-sm text-muted">No audit logs found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="pb-3 font-medium">Time</th>
            <th className="pb-3 font-medium">Account</th>
            <th className="pb-3 font-medium">Action</th>
            <th className="pb-3 font-medium">Resource</th>
            <th className="pb-3 font-medium">IP</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => (
            <tr key={log.auditLogId} className="border-b border-border/60">
              <td className="py-3 text-muted">{new Date(log.createdAt).toLocaleString()}</td>
              <td className="py-3">
                {log.account
                  ? `${log.account.firstName} ${log.account.lastName}`
                  : '—'}
              </td>
              <td className="py-3">{log.action.replace(/_/g, ' ')}</td>
              <td className="py-3 text-muted">{log.resource || '—'}</td>
              <td className="py-3 font-mono text-xs text-muted">{formatAuditIp(log) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
