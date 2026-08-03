import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { OrgSettingsForm } from '@/components/admin/settings/OrgSettingsForm';
import { fetchCountries } from '@/store/slices/countrySlice';

export function AdminSettingsPage() {
  usePageTitle('Organization settings');
  const dispatch = useDispatch();
  useEffect(() => { dispatch(fetchCountries()); }, [dispatch]);

  return (
    <div className="mx-auto max-w-3xl">
      <OrgSettingsForm />
    </div>
  );
}
