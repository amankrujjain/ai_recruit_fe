import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { OrgListTable } from '@/components/super-admin/OrgListTable';
import { ListToolbar } from '@/components/super-admin/ListToolbar';
import { PaginationBar } from '@/components/super-admin/PaginationBar';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { fetchOrganizations, selectOrganizations } from '@/store/slices/organizationSlice';

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created date' },
  { value: 'organizationName', label: 'Name' },
];

export function AllOrganizationsPage() {
  usePageTitle('All organizations');
  const dispatch = useDispatch();
  const { items, pagination, loading } = useSelector(selectOrganizations);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => { setPage(1); }, [debouncedSearch, sortBy, sortOrder]);
  useEffect(() => {
    dispatch(fetchOrganizations({
      page,
      search: debouncedSearch || undefined,
      sortBy,
      sortOrder,
    }));
  }, [dispatch, page, debouncedSearch, sortBy, sortOrder]);

  if (loading && items.length === 0) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <ListToolbar
        search={search}
        onSearchChange={setSearch}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        sortOptions={SORT_OPTIONS}
        placeholder="Search verified organizations..."
      />
      <OrgListTable items={items} loading={loading} />
      <PaginationBar pagination={pagination} onPageChange={setPage} />
    </div>
  );
}
