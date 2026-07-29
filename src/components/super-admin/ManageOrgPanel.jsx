import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { selectCountries } from '@/store/slices/countrySlice';
import {
  deleteOrganization,
  fetchOrganizationById,
  selectOrganizations,
  updateOrganization,
} from '@/store/slices/organizationSlice';

export function ManageOrgPanel({ organizationId, onDeleted }) {
  const dispatch = useDispatch();
  const { items: countries } = useSelector(selectCountries);
  const { selected, loading, saving, deleting } = useSelector(selectOrganizations);
  const [form, setForm] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (organizationId) dispatch(fetchOrganizationById(organizationId));
  }, [dispatch, organizationId]);

  useEffect(() => {
    if (selected) {
      setForm({
        organizationName: selected.organizationName || '',
        city: selected.city || '',
        countryId: selected.countryId || '',
        isActive: selected.isActive ?? true,
      });
    }
  }, [selected]);

  if (!organizationId) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted">
          Select an organization from the list to manage it.
        </CardContent>
      </Card>
    );
  }

  if (loading || !form) {
    return <Card><CardContent className="py-10 text-sm text-muted">Loading...</CardContent></Card>;
  }

  const onChange = (field) => (e) => {
    const value = field === 'isActive' ? e.target.value === 'true' : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const result = await dispatch(updateOrganization({ organizationId, payload: form }));
    if (updateOrganization.fulfilled.match(result)) {
      toast.success('Organization updated');
    } else {
      toast.error(result.payload || 'Update failed');
    }
  };

  const handleDelete = async () => {
    const result = await dispatch(deleteOrganization(organizationId));
    setConfirmOpen(false);
    if (deleteOrganization.fulfilled.match(result)) {
      toast.success('Organization deleted');
      onDeleted?.();
    } else {
      toast.error(result.payload || 'Delete failed');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Manage organization</h2>
        <p className="text-sm text-muted">{selected.organizationName}</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manage-name">Organization name</Label>
            {/* <Input id="manage-name" value={form.organizationName} onChange={onChange('organizationName')} required /> */}
            <Input 
  id="manage-name" 
  value={form.organizationName} 
  readOnly 
  required 
/>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manage-country">Country</Label>
              <Select id="manage-country" value={form.countryId} onChange={onChange('countryId')}>
                <option value="">Select country</option>
                {countries.map((c) => (
                  <option key={c.countryId} value={c.countryId}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manage-city">City</Label>
              <Input id="manage-city" value={form.city} onChange={onChange('city')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="manage-status">Status</Label>
            <Select id="manage-status" value={String(form.isActive)} onChange={onChange('isActive')}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save changes'}</Button>
            <Button type="button" variant="outline" disabled={deleting} onClick={() => setConfirmOpen(true)}>
              Delete
            </Button>
          </div>
        </form>
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete organization?"
        description={`Delete ${selected.organizationName}? This soft-deletes the organization and cannot be easily undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onOpenChange={setConfirmOpen}
        onConfirm={handleDelete}
      />
    </Card>
  );
}
