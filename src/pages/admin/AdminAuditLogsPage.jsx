import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { AuditLogTable } from '@/components/admin/audit/AuditLogTable';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { fetchAuditLogs, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminAuditLogsPage() {
  usePageTitle('Audit logs');
  const dispatch = useDispatch();
  const { auditLogs, auditPagination, auditLoading } = useSelector(selectAdminOrg);
  const [page, setPage] = useState(1);

  const booting = usePageBootstrap(
    () => dispatch(fetchAuditLogs({ page, limit: 20 })),
    [dispatch, page]
  );

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <AuditLogTable items={auditLogs} loading={auditLoading} />
      <PaginationBar pagination={auditPagination} onPageChange={setPage} />
    </div>
  );
}
