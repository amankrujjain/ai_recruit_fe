import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { OrgListTable } from '@/components/super-admin/OrgListTable';
import { ManageOrgPanel } from '@/components/super-admin/ManageOrgPanel';
import { ListToolbar } from '@/components/super-admin/ListToolbar';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchCountries } from '@/store/slices/countrySlice';
import {
  clearSelectedOrg,
  fetchOrganizations,
  selectOrganizations,
} from '@/store/slices/organizationSlice';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'organizationName', label: 'Name' },
];

export function ManageOrganizationPage() {
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectOrganizations);
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebouncedValue(search);

  const load = () => dispatch(fetchOrganizations({
    page,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  }));

  useEffect(() => { dispatch(fetchCountries()); }, [dispatch]);
  useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, sortOrder]);
  useEffect(() => { load(); }, [dispatch, page, debouncedSearch, sortBy, sortOrder]);

  const handleDeleted = () => {
    setSelectedId(null);
    dispatch(clearSelectedOrg());
    load();
  };

  return (
    <DashboardShell title="Manage organizations">
      <div className="mx-auto max-w-6xl space-y-6">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          sortOrder={sortOrder}
          onSortOrderChange={setSortOrder}
          sortOptions={SORT_OPTIONS}
          placeholder="Search organizations to manage..."
        />
        <div className="grid gap-6 lg:grid-cols-2">
          <OrgListTable
            items={items}
            loading={loading}
            onSelect={setSelectedId}
          />
          <ManageOrgPanel organizationId={selectedId} onDeleted={handleDeleted} />
        </div>
        <PaginationBar pagination={pagination} onPageChange={setPage} />
      </div>
    </DashboardShell>
  );
}
