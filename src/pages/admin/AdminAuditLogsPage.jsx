import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { fetchAuditLogs, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminAuditLogsPage() {
  const dispatch = useDispatch();
  const { auditLogs, auditPagination, auditLoading } = useSelector(selectAdminOrg);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchAuditLogs({ page, limit: 20 }));
  }, [dispatch, page]);

  return (
    <DashboardShell title="Audit logs">
      <div className="mx-auto max-w-6xl space-y-4">
        <AuditLogTable items={auditLogs} loading={auditLoading} />
        <PaginationBar pagination={auditPagination} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}
