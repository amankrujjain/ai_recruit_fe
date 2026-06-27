import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { OrgSettingsForm } from '@/components/admin/settings/OrgSettingsForm';
import { fetchCountries } from '@/store/slices/countrySlice';

export function AdminSettingsPage() {
  const dispatch = useDispatch();
  useEffect(() => { dispatch(fetchCountries()); }, [dispatch]);

  return (
    <DashboardShell title="Organization settings">
      <div className="mx-auto max-w-3xl">
        <OrgSettingsForm />
      </div>
    </DashboardShell>
  );
}
