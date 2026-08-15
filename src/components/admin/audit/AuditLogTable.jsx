import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, MoreVertical } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatAuditIp } from '@/lib/formatAuditIp';
import {
  composeAuditDetails,
  deriveStatus,
  formatAuditTime,
  getActionLabel,
  getModuleMeta,
} from '@/lib/auditLog';
import { AuditLogDetailModal } from '@/components/admin/audit/AuditLogDetailModal';
import { cn } from '@/lib/utils';

function SortIcon({ active, direction }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
  return direction === 'asc'
    ? <ArrowUp className="h-3.5 w-3.5" />
    : <ArrowDown className="h-3.5 w-3.5" />;
}

function SortableTh({ label, column, sort, onSort, className }) {
  const active = sort.column === column;
  return (
    <th className={cn('pb-3 pr-4 font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
      >
        {label}
        <SortIcon active={active} direction={sort.direction} />
      </button>
    </th>
  );
}

export function compareLogs(a, b, column) {
  const statusA = deriveStatus(a);
  const statusB = deriveStatus(b);

  switch (column) {
    case 'time':
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case 'user': {
      const nameA = a.account
        ? `${a.account.firstName || ''} ${a.account.lastName || ''}`.trim().toLowerCase()
        : '';
      const nameB = b.account
        ? `${b.account.firstName || ''} ${b.account.lastName || ''}`.trim().toLowerCase()
        : '';
      return nameA.localeCompare(nameB);
    }
    case 'module':
      return String(a.module || '').localeCompare(String(b.module || ''));
    case 'action':
      return String(a.action || '').localeCompare(String(b.action || ''));
    case 'status':
      return statusA.localeCompare(statusB);
    default:
      return 0;
  }
}

export function AuditLogTable({ items, loading }) {
  const [sort, setSort] = useState({ column: 'time', direction: 'desc' });
  const [detailLog, setDetailLog] = useState(null);

  const onSort = (column) => {
    setSort((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { column, direction: column === 'time' ? 'desc' : 'asc' };
    });
  };

  const sorted = useMemo(() => {
    const copy = [...(items || [])];
    copy.sort((a, b) => {
      const cmp = compareLogs(a, b, sort.column);
      return sort.direction === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [items, sort]);

  if (loading && (!items || items.length === 0)) {
    return <p className="py-8 text-center text-sm text-muted">Loading audit logs...</p>;
  }

  if (!items || items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No audit logs found for the selected filters.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-muted">
              <SortableTh label="Time" column="time" sort={sort} onSort={onSort} />
              <SortableTh label="User" column="user" sort={sort} onSort={onSort} />
              <SortableTh label="Module" column="module" sort={sort} onSort={onSort} />
              <SortableTh label="Action" column="action" sort={sort} onSort={onSort} />
              <th className="pb-3 pr-4 font-medium">Details</th>
              <th className="pb-3 pr-4 font-medium">IP Address</th>
              <SortableTh label="Status" column="status" sort={sort} onSort={onSort} />
              <th className="pb-3 font-medium text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((log) => {
              const status = deriveStatus(log);
              const failed = status === 'failed';
              const moduleMeta = getModuleMeta(log.module);
              const ModuleIcon = moduleMeta.icon;
              const account = log.account;

              return (
                <tr
                  key={log.auditLogId}
                  className={cn(
                    'border-b border-border/60 last:border-0',
                    failed && 'bg-red-50/40'
                  )}
                >
                  <td className="py-3.5 pr-4 whitespace-nowrap text-muted">
                    {formatAuditTime(log.createdAt)}
                  </td>
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        firstName={account?.firstName}
                        lastName={account?.lastName}
                        className="h-8 w-8 text-[10px]"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {account
                            ? `${account.firstName || ''} ${account.lastName || ''}`.trim() || 'Unknown'
                            : 'System'}
                        </p>
                        <p className="truncate text-xs text-muted">{account?.email || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 text-foreground">
                      <ModuleIcon className="h-4 w-4 shrink-0 text-brand-500" />
                      <span className="truncate">{moduleMeta.label}</span>
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-foreground">
                    {getActionLabel(log.action)}
                  </td>
                  <td className="max-w-[220px] py-3.5 pr-4 truncate text-muted" title={composeAuditDetails(log)}>
                    {composeAuditDetails(log)}
                  </td>
                  <td className="py-3.5 pr-4 font-mono text-xs text-muted">
                    {formatAuditIp(log) || '—'}
                  </td>
                  <td className="py-3.5 pr-4">
                    <Badge variant={failed ? 'danger' : 'success'}>
                      {failed ? 'Failed' : 'Success'}
                    </Badge>
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailLog(log)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-brand-50 hover:text-brand-600"
                      aria-label="View activity details"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AuditLogDetailModal
        open={Boolean(detailLog)}
        onOpenChange={(open) => {
          if (!open) setDetailLog(null);
        }}
        log={detailLog}
      />
    </>
  );
}
