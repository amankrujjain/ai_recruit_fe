import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { usePageTitle } from '@/context/PageTitleContext';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/SelectMenu';
import {
  clearSupportError,
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  selectSupport,
  updateCategory,
} from '@/store/slices/supportSlice';

const AUDIENCE_OPTIONS = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'BOTH', label: 'Both' },
];

const emptyForm = { name: '', description: '', audience: 'BOTH', sortOrder: 0 };

export function SupportCategoriesPage() {
  usePageTitle('Support Categories');
  const dispatch = useDispatch();
  const { categories, loading, saving, actionId, error } = useSelector(selectSupport);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { dispatch(fetchAdminCategories()); }, [dispatch]);

  const openCreate = () => {
    dispatch(clearSupportError());
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (category) => {
    dispatch(clearSupportError());
    setForm({
      name: category.name,
      description: category.description || '',
      audience: category.audience,
      sortOrder: category.sortOrder,
    });
    setEditingId(category.categoryId);
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    dispatch(clearSupportError());
  };

  const submit = async (event) => {
    event.preventDefault();
    const payload = { ...form, sortOrder: Number(form.sortOrder) || 0 };
    const result = editingId
      ? await dispatch(updateCategory({ categoryId: editingId, payload }))
      : await dispatch(createCategory(payload));

    if (result.meta.requestStatus === 'fulfilled') {
      toast.success(editingId ? 'Support category updated' : 'Support category created');
      closeForm();
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    const result = await dispatch(deleteCategory(category.categoryId));
    if (result.meta.requestStatus === 'fulfilled') toast.success('Support category deleted');
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Support Categories"
        subtitle="Manage categories shown to organization administrators and recruiters."
        actionLabel="Add category"
        onAction={openCreate}
      />

      {formOpen && (
        <Card>
          <CardContent className="pt-6">
            <form className="space-y-4" onSubmit={submit}>
              <h3 className="text-lg font-semibold">{editingId ? 'Edit category' : 'Add category'}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-medium">
                  Name
                  <input className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength="2" maxLength="100" required />
                </label>
                <label className="space-y-1 text-sm font-medium">
                  Audience
                  <FilterSelect value={form.audience} onValueChange={(audience) => setForm({ ...form, audience })} options={AUDIENCE_OPTIONS} />
                </label>
              </div>
              <label className="block space-y-1 text-sm font-medium">
                Description
                <textarea className="min-h-24 w-full rounded-lg border border-border bg-card p-3 font-normal" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
              </label>
              <label className="block max-w-48 space-y-1 text-sm font-medium">
                Sort order
                <input className="h-10 w-full rounded-lg border border-border bg-card px-3 font-normal" type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: event.target.value })} />
              </label>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save category'}</Button>
                <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading && categories.length === 0 && <p className="text-sm text-muted">Loading categories...</p>}
          {!loading && categories.length === 0 && <p className="text-sm text-muted">No support categories found.</p>}
          {error && !formOpen && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {categories.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="border-b text-muted"><tr><th className="pb-3 font-medium">Name</th><th className="pb-3 font-medium">Audience</th><th className="pb-3 font-medium">Sort order</th><th className="pb-3 font-medium">Description</th><th className="pb-3 font-medium" /></tr></thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.categoryId} className="border-b last:border-0">
                      <td className="py-4 font-medium">{category.name}</td>
                      <td className="py-4">{category.audience}</td>
                      <td className="py-4">{category.sortOrder}</td>
                      <td className="py-4 text-muted">{category.description || '—'}</td>
                      <td className="py-4 text-right"><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => openEdit(category)} disabled={actionId === category.categoryId}>Edit</Button><Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={() => remove(category)} disabled={actionId === category.categoryId}>{actionId === category.categoryId ? 'Deleting...' : 'Delete'}</Button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
