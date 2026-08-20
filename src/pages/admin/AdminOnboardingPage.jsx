import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarDays, Clock3, LogOut, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormSelect } from '@/components/ui/SelectMenu';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import {
  completeOnboarding,
  fetchMyOrganization,
  selectAdminOrg,
} from '@/store/slices/adminOrgSlice';
import { logoutUser, selectAuth, setOnboardingCompleted } from '@/store/slices/authSlice';

const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
];

const inputClass = 'h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none';

function buildForm(organization) {
  const settings = organization?.settings || {};
  return {
    displayName: settings.displayName || organization?.organizationName || '',
    phone: organization?.phone || '',
    timezone: organization?.timezone || 'UTC',
    workingHoursStart: organization?.workingHoursStart || '09:00',
    workingHoursEnd: organization?.workingHoursEnd || '18:00',
    workingDays: Array.isArray(organization?.workingDays) && organization.workingDays.length
      ? [...organization.workingDays]
      : ['mon', 'tue', 'wed', 'thu', 'fri'],
  };
}

export function AdminOnboardingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account } = useSelector(selectAuth);
  const { organization, loading, saving } = useSelector(selectAdminOrg);
  const [form, setForm] = useState(null);

  useEffect(() => {
    dispatch(fetchMyOrganization());
  }, [dispatch]);

  useEffect(() => {
    if (organization) setForm(buildForm(organization));
  }, [organization]);

  const timezoneOptions = useMemo(() => {
    const current = form?.timezone;
    if (current && !TIMEZONES.includes(current)) return [current, ...TIMEZONES];
    return TIMEZONES;
  }, [form?.timezone]);

  const onChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleWorkingDay = (dayKey) => {
    setForm((f) => {
      const has = (f.workingDays || []).includes(dayKey);
      return {
        ...f,
        workingDays: has
          ? f.workingDays.filter((d) => d !== dayKey)
          : [...(f.workingDays || []), dayKey],
      };
    });
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.workingDays?.length) {
      toast.error('Select at least one working day');
      return;
    }

    const result = await dispatch(completeOnboarding({
      phone: form.phone,
      displayName: form.displayName,
      timezone: form.timezone,
      workingHoursStart: form.workingHoursStart,
      workingHoursEnd: form.workingHoursEnd,
      workingDays: form.workingDays,
    }));

    if (completeOnboarding.fulfilled.match(result)) {
      dispatch(setOnboardingCompleted(true));
      toast.success('Onboarding complete — welcome aboard');
      navigate('/admin', { replace: true });
    } else {
      toast.error(result.payload || 'Failed to complete onboarding');
    }
  };

  return (
    <div className="min-h-dvh bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <Zap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-brand-700">RecruitAI</p>
            <p className="text-xs text-muted">Finish setup to unlock your workspace</p>
          </div>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Complete organization onboarding
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Hi {account?.firstName || 'there'} — set the required details for{' '}
            <span className="font-medium text-slate-700">
              {organization?.organizationName || 'your organization'}
            </span>
            . You can refine AI preferences later in Settings.
          </p>
        </div>

        {loading && !form ? (
          <p className="text-sm text-muted">Loading organization…</p>
        ) : form ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="px-6 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Company details</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Required before you can use the app.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 px-6 pb-6 pt-0 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Organization name</Label>
                  <Input value={organization?.organizationName || ''} readOnly className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onboarding-display-name">Display name <span className="text-red-500">*</span></Label>
                  <Input
                    id="onboarding-display-name"
                    value={form.displayName}
                    onChange={onChange('displayName')}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="onboarding-phone">Phone <span className="text-red-500">*</span></Label>
                  <Input
                    id="onboarding-phone"
                    value={form.phone}
                    onChange={onChange('phone')}
                    required
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Timezone <span className="text-red-500">*</span></Label>
                  <FormSelect
                    value={form.timezone}
                    onValueChange={(value) => setField('timezone', value)}
                    options={timezoneOptions.map((zone) => ({ value: zone, label: zone }))}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="px-6 pb-4 pt-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                    <Clock3 className="h-4 w-4" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-slate-900">Working hours</h2>
                    <p className="mt-0.5 text-sm text-slate-500">Default operating window for scheduling.</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 px-6 pb-6 pt-0">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-slate-500">
                    <CalendarDays className="h-4 w-4 text-emerald-500" />
                    Working days <span className="text-red-500">*</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const active = form.workingDays.includes(day.key);
                      return (
                        <button
                          key={day.key}
                          type="button"
                          onClick={() => toggleWorkingDay(day.key)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            active
                              ? 'border-brand-200 bg-brand-50 text-brand-700'
                              : 'border-slate-200 bg-white text-slate-500'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-start">Start <span className="text-red-500">*</span></Label>
                    <Input
                      id="onboarding-start"
                      type="time"
                      value={form.workingHoursStart}
                      onChange={onChange('workingHoursStart')}
                      required
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="onboarding-end">End <span className="text-red-500">*</span></Label>
                    <Input
                      id="onboarding-end"
                      type="time"
                      value={form.workingHoursEnd}
                      onChange={onChange('workingHoursEnd')}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button type="submit" disabled={saving} className="h-10 rounded-lg px-5">
              {saving ? 'Saving…' : 'Complete onboarding'}
            </Button>
          </form>
        ) : null}
      </main>
    </div>
  );
}
