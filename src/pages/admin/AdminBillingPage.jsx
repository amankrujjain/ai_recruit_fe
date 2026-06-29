import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { BillingOverview } from '@/components/admin/billing/BillingOverview';
import { fetchBilling, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminBillingPage() {
  const dispatch = useDispatch();
  const { billing, billingLoading } = useSelector(selectAdminOrg);

  useEffect(() => { dispatch(fetchBilling()); }, [dispatch]);

  return (
    <DashboardShell title="Billing">
      <div className="mx-auto max-w-4xl">
        <BillingOverview billing={billing} loading={billingLoading} />
      </div>
    </DashboardShell>
  );
}
