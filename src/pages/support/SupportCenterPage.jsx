import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { fetchOrgCategories, selectSupport } from '@/store/slices/supportSlice';

export function SupportCenterPage() {
  usePageTitle('Support Center');
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(selectSupport);

  useEffect(() => { dispatch(fetchOrgCategories()); }, [dispatch]);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Support Center" subtitle="Browse the support categories available to your role." />

      {loading && <p className="text-sm text-muted">Loading categories...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && categories.length === 0 && (
        <Card><CardContent className="py-8 text-sm text-muted">No support categories are available yet.</CardContent></Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.categoryId}>
            <CardContent className="space-y-2 pt-6">
              <h3 className="font-semibold text-foreground">{category.name}</h3>
              {category.description && <p className="text-sm text-muted">{category.description}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
