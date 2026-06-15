import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { OrgDetailsFields } from '@/components/super-admin/OrgDetailsFields';
import { AdminInviteFields } from '@/components/super-admin/AdminInviteFields';
import { selectCountries } from '@/store/slices/countrySlice';
import { createRegistration, selectRegistrations } from '@/store/slices/registrationSlice';

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
  const { creating } = useSelector(selectRegistrations);
  const [form, setForm] = useState(emptyForm);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(createRegistration(form));
    if (createRegistration.fulfilled.match(result)) {
      toast.success('Verification link sent — organization will be created after admin confirms');
      setForm(emptyForm);
      onCreated?.();
    } else {
      toast.error(result.payload || 'Failed to send verification');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Register organization</h2>
        <p className="text-sm text-muted">
          Sends a verification link. The organization is created only after the admin activates.
        </p>
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
            {creating ? 'Sending...' : 'Send verification link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
