import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { CreateOrgForm } from '@/components/super-admin/CreateOrgForm';
import { InviteSuccessBanner } from '@/components/super-admin/InviteSuccessBanner';
import { OrgTable } from '@/components/super-admin/OrgTable';
import { OrgSearchBar } from '@/components/super-admin/OrgSearchBar';
import { fetchCountries } from '@/store/slices/countrySlice';
import { fetchOrganizations, selectOrganizations } from '@/store/slices/organizationSlice';

export function SuperAdminOrganizationsPage() {
  const dispatch = useDispatch();
  const { items, loading } = useSelector(selectOrganizations);
  const [search, setSearch] = useState('');

  const loadOrgs = () => dispatch(fetchOrganizations({ search: search || undefined }));

  useEffect(() => {
    dispatch(fetchCountries());
    loadOrgs();
  }, [dispatch]);

  useEffect(() => {
    const timer = setTimeout(loadOrgs, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <DashboardShell title="Super Admin">
      <div className="mx-auto max-w-6xl space-y-6">
        <InviteSuccessBanner />
        <CreateOrgForm onCreated={loadOrgs} />
        <OrgSearchBar value={search} onChange={setSearch} />
        <OrgTable items={items} loading={loading} />
      </div>
    </DashboardShell>
  );
}
