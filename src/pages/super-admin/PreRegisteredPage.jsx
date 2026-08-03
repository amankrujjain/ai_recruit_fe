import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { CreateOrgForm } from '@/components/super-admin/CreateOrgForm';
import { VerificationSuccessBanner } from '@/components/super-admin/VerificationSuccessBanner';
import { RegistrationTable } from '@/components/super-admin/RegistrationTable';
import { ListToolbar } from '@/components/super-admin/ListToolbar';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchCountries } from '@/store/slices/countrySlice';
import { fetchRegistrations, selectRegistrations } from '@/store/slices/registrationSlice';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'organizationName', label: 'Name' },
  { value: 'adminEmail', label: 'Admin email' },
];

export function PreRegisteredPage() {
  usePageTitle('Pre-registered organizations');
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectRegistrations);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebouncedValue(search);

  const load = () => dispatch(fetchRegistrations({
    page,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  }));

  useEffect(() => { dispatch(fetchCountries()); }, [dispatch]);
  useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, sortOrder]);
  useEffect(() => { load(); }, [dispatch, page, debouncedSearch, sortBy, sortOrder]);

  if (loading && items.length === 0) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <VerificationSuccessBanner />
      <CreateOrgForm onCreated={load} />
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        sortOptions={SORT_OPTIONS}
        placeholder="Search pending organizations..."
      />
      <RegistrationTable items={items} loading={loading} />
      <PaginationBar pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
