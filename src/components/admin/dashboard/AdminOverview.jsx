import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UserStatus } from '@/lib/userStatus';
import { selectAuth } from '@/store/slices/authSlice';
import { fetchRecruiters, selectRecruiters } from '@/store/slices/recruitersSlice';
import { fetchMyOrganization, fetchAuditLogs, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminOverview() {
  const dispatch = useDispatch();
  const { account } = useSelector(selectAuth);
  const { items: recruiters } = useSelector(selectRecruiters);
  const { organization, auditLogs, loading } = useSelector(selectAdminOrg);

  useEffect(() => {
    dispatch(fetchMyOrganization());
    dispatch(fetchRecruiters({ limit: 100 }));
    dispatch(fetchAuditLogs({ limit: 5 }));
  }, [dispatch]);

  const activeCount = recruiters.filter((r) => r.status === UserStatus.ACTIVE).length;
  const pendingCount = recruiters.filter((r) => r.status === UserStatus.PENDING).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">
            Welcome, {account?.firstName}
          </h2>
          <p className="text-sm text-muted">
            {organization?.organizationName || 'Your organization'} · {organization?.timezone || 'UTC'}
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild><Link to="/admin/recruiters">Invite recruiter</Link></Button>
          <Button variant="outline" asChild><Link to="/admin/settings">Organization settings</Link></Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-bold">{activeCount}</p>
          <p className="text-sm text-muted">Active recruiters</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-bold">{pendingCount}</p>
          <p className="text-sm text-muted">Pending invites</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-2xl font-bold">{recruiters.length}</p>
          <p className="text-sm text-muted">Total recruiters</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold">Recent activity</h3></CardHeader>
        <CardContent>
          {loading && auditLogs.length === 0 ? (
            <p className="text-sm text-muted">Loading...</p>
          ) : auditLogs.length === 0 ? (
            <p className="text-sm text-muted">No recent activity.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {auditLogs.map((log) => (
                <li key={log.auditLogId} className="flex justify-between gap-4 border-b border-border/50 pb-2">
                  <span>{log.action.replace(/_/g, ' ')}</span>
                  <span className="shrink-0 text-muted">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Button variant="ghost" size="sm" className="mt-4" asChild>
            <Link to="/admin/audit-logs">View all logs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
