import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { BillingOverview } from '@/components/admin/billing/BillingOverview';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { fetchBilling, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminBillingPage() {
  usePageTitle('Billing');
  const dispatch = useDispatch();
  const { billing, billingLoading } = useSelector(selectAdminOrg);

  const booting = usePageBootstrap(
    () => dispatch(fetchBilling()),
    [dispatch]
  );

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <BillingOverview billing={billing} loading={billingLoading} />
    </div>
  );
}
