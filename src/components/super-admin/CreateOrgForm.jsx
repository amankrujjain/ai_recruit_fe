import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { OrgDetailsFields } from '@/components/super-admin/OrgDetailsFields';
import { AdminInviteFields } from '@/components/super-admin/AdminInviteFields';
import { selectCountries } from '@/store/slices/countrySlice';
import { createOrganization, selectOrganizations } from '@/store/slices/organizationSlice';

const emptyForm = {
  organizationName: '',
  countryId: '',
  city: '',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
};

export function CreateOrgForm({ onCreated }) {
  const dispatch = useDispatch();
  const { items: countries, loading: countriesLoading } = useSelector(selectCountries);
  const { creating } = useSelector(selectOrganizations);
  const [form, setForm] = useState(emptyForm);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createOrganization(form));
    if (createOrganization.fulfilled.match(result)) {
      toast.success('Organization created and admin invited');
      setForm(emptyForm);
      onCreated?.();
    } else {
      toast.error(result.payload || 'Failed to create organization');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Create organization</h2>
        <p className="text-sm text-muted">Set up a new agency and invite their admin.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <OrgDetailsFields
            form={form}
            onChange={onChange}
            countries={countries}
            countriesLoading={countriesLoading}
          />
          <AdminInviteFields form={form} onChange={onChange} />
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating...' : 'Create & send invite'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
