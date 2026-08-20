import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { resendVerification, selectRegistrations } from '@/store/slices/registrationSlice';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

export function RegistrationTable({ items, loading }) {
  const dispatch = useDispatch();
  const { resendingId } = useSelector(selectRegistrations);

  const handleResend = async (registrationId) => {
    const result = await dispatch(resendVerification(registrationId));
    if (resendVerification.fulfilled.match(result)) {
      toast.success('New verification link sent.');
    } else {
      toast.error(result.payload || 'Failed to resend link');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Pending registrations</h2>
        <p className="text-sm text-muted">Organizations awaiting admin verification.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {loading && items.length === 0 ? (
          <p className="text-sm text-muted">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">No pending registrations.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-muted">
                <th className="pb-3 font-medium">Organization</th>
                <th className="pb-3 font-medium">POC / email</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Expires</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.registrationId} className="border-b border-border/60">
                  <td className="py-3 font-medium">{row.organizationName}</td>
                  <td className="py-3">
                    <p>{row.adminFirstName} {row.adminLastName}</p>
                    <p className="text-xs text-muted">{row.adminEmail}</p>
                  </td>
                  <td className="py-3 text-muted">
                    {[row.city, row.country?.name].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="py-3">
                    <Badge variant="warning">{formatDate(row.tokenExpiresAt)}</Badge>
                  </td>
                  <td className="py-3">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={resendingId === row.registrationId}
                      onClick={() => handleResend(row.registrationId)}
                    >
                      {resendingId === row.registrationId ? 'Sending...' : 'Resend link'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
