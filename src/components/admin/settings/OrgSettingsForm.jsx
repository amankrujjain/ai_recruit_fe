import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ImagePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import {
  fetchMyOrganization,
  updateOrgSettings,
  uploadOrgLogo,
  selectAdminOrg,
} from '@/store/slices/adminOrgSlice';
import { resolveAssetUrl } from '@/lib/assetUrl';

export function OrgSettingsForm() {
  const dispatch = useDispatch();
  const { organization, saving, logoUploading } = useSelector(selectAdminOrg);
  const [form, setForm] = useState(null);
  const logoInputRef = useRef(null);

  useEffect(() => { dispatch(fetchMyOrganization()); }, [dispatch]);
  useEffect(() => {
    if (organization) {
      setForm({
        organizationName: organization.organizationName || '',
        city: organization.city || '',
        timezone: organization.timezone || 'UTC',
        workingHoursStart: organization.workingHoursStart || '09:00',
        workingHoursEnd: organization.workingHoursEnd || '18:00',
        defaultCallDuration: organization.defaultCallDuration ?? 30,
        maxReschedules: organization.maxReschedules ?? 3,
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
      city: form.city || null,
    };
    const result = await dispatch(updateOrgSettings(payload));
    if (updateOrgSettings.fulfilled.match(result)) toast.success('Settings saved');
    else toast.error(result.payload || 'Failed to save');
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await dispatch(uploadOrgLogo(file));
    if (uploadOrgLogo.fulfilled.match(result)) toast.success('Logo uploaded');
    else toast.error(result.payload || 'Logo upload failed');
  };

  const logoSrc = resolveAssetUrl(organization?.logoUrl);
  const countryName = organization?.country?.name || '—';

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
            <Input value={countryName} disabled readOnly />
            <p className="text-xs text-muted">Country is set at registration and can only be changed by Super Admin.</p>
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.city} onChange={onChange('city')} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Logo</Label>
            <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-slate-50/80 px-4 py-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                {logoSrc ? (
                  <img
                    src={logoSrc}
                    alt="Organization logo"
                    className="h-full w-full object-contain p-1.5"
                  />
                ) : (
                  <ImagePlus className="h-7 w-7 text-slate-300" aria-hidden />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="sr-only"
                  onChange={handleLogoChange}
                  disabled={logoUploading}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUploading ? 'Uploading…' : logoSrc ? 'Change logo' : 'Upload logo'}
                </Button>
                <p className="text-xs text-muted">PNG, JPG, WebP, or GIF</p>
              </div>
            </div>
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
