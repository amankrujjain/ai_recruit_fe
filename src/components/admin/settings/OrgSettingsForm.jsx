import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { selectCountries } from '@/store/slices/countrySlice';
import { fetchMyOrganization, updateOrgSettings, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function OrgSettingsForm() {
  const dispatch = useDispatch();
  const { items: countries } = useSelector(selectCountries);
  const { organization, saving } = useSelector(selectAdminOrg);
  const [form, setForm] = useState(null);

  useEffect(() => { dispatch(fetchMyOrganization()); }, [dispatch]);
  useEffect(() => {
    if (organization) {
      setForm({
        organizationName: organization.organizationName || '',
        countryId: organization.countryId || '',
        city: organization.city || '',
        timezone: organization.timezone || 'UTC',
        workingHoursStart: organization.workingHoursStart || '09:00',
        workingHoursEnd: organization.workingHoursEnd || '18:00',
        defaultCallDuration: organization.defaultCallDuration ?? 30,
        maxReschedules: organization.maxReschedules ?? 3,
        logoUrl: organization.logoUrl || '',
      });
    }
  }, [organization]);

  if (!form) return <p className="text-sm text-muted">Loading settings...</p>;

  const onChange = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      defaultCallDuration: Number(form.defaultCallDuration),
      maxReschedules: Number(form.maxReschedules),
      logoUrl: form.logoUrl || null,
      city: form.city || null,
    };
    const result = await dispatch(updateOrgSettings(payload));
    if (updateOrgSettings.fulfilled.match(result)) toast.success('Settings saved');
    else toast.error(result.payload || 'Failed to save');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader><h3 className="font-semibold">Organization profile</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Name</Label>
            <Input value={form.organizationName} onChange={onChange('organizationName')} required />
          </div>
          <div className="space-y-2">
            <Label>Country</Label>
            <Select value={form.countryId} onChange={onChange('countryId')}>
              <option value="">Select</option>
              {countries.map((c) => <option key={c.countryId} value={c.countryId}>{c.name}</option>)}
            </Select>
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={onChange('city')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Logo URL</Label>
            <Input value={form.logoUrl} onChange={onChange('logoUrl')} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><h3 className="font-semibold">Regional & calls</h3></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={form.timezone} onChange={onChange('timezone')} />
          </div>
          <div className="space-y-2">
            <Label>Call duration (min)</Label>
            <Input type="number" value={form.defaultCallDuration} onChange={onChange('defaultCallDuration')} />
          </div>
          <div className="space-y-2">
            <Label>Working hours start</Label>
            <Input value={form.workingHoursStart} onChange={onChange('workingHoursStart')} />
          </div>
          <div className="space-y-2">
            <Label>Working hours end</Label>
            <Input value={form.workingHoursEnd} onChange={onChange('workingHoursEnd')} />
          </div>
          <div className="space-y-2">
            <Label>Max reschedules</Label>
            <Input type="number" value={form.maxReschedules} onChange={onChange('maxReschedules')} />
          </div>
        </CardContent>
      </Card>
      <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save settings'}</Button>
    </form>
  );
}
