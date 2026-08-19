import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  Bot,
  BrainCircuit,
  Building2,
  CalendarDays,
  Check,
  Clock3,
  FileText,
  FolderOpen,
  Globe2,
  Headset,
  ImagePlus,
  Info,
  Languages,
  Mic,
  Play,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { FormSelect } from '@/components/ui/SelectMenu';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  fetchMyOrganization,
  updateOrgSettings,
  updateAiPreferences,
  uploadOrgLogo,
  fetchVoices,
  selectAdminOrg,
} from '@/store/slices/adminOrgSlice';
import { resolveAssetUrl } from '@/lib/assetUrl';

const DAYS = [
  { key: 'mon', label: 'Monday', short: 'Mon' },
  { key: 'tue', label: 'Tuesday', short: 'Tue' },
  { key: 'wed', label: 'Wednesday', short: 'Wed' },
  { key: 'thu', label: 'Thursday', short: 'Thu' },
  { key: 'fri', label: 'Friday', short: 'Fri' },
  { key: 'sat', label: 'Saturday', short: 'Sat' },
  { key: 'sun', label: 'Sunday', short: 'Sun' },
];

const INDUSTRIES = [
  'Information Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Other',
];

const COMPANY_SIZES = [
  '1 - 10',
  '11 - 50',
  '51 - 200',
  '201 - 500',
  '501 - 1000',
  '1000+',
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

const LLM_PRIMARY = { value: 'gpt-4o-mini', label: 'GPT-4o mini' };
const LLM_SECONDARY = { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' };
const DEFAULT_SCORES = {
  scoreTechnical: 40,
  scoreCommunication: 20,
  scoreProblemSolving: 20,
  scoreExperience: 10,
  scoreOthers: 10,
};

const INTERVIEW_STYLES = [
  { value: 'Balanced', label: 'Balanced' },
  { value: 'Structured', label: 'Structured' },
  { value: 'Conversational', label: 'Conversational' },
];

const DIFFICULTIES = [
  { value: 'Easy', label: 'Easy' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Hard', label: 'Hard' },
];

const SILENCE_TIMEOUTS = [
  { value: '5', label: '5 Seconds' },
  { value: '10', label: '10 Seconds' },
  { value: '15', label: '15 Seconds' },
  { value: '20', label: '20 Seconds' },
];

const MAX_SOURCES = [
  { value: '3', label: '3 Sources' },
  { value: '5', label: '5 Sources' },
  { value: '7', label: '7 Sources' },
  { value: '10', label: '10 Sources' },
];

const KNOWLEDGE_SOURCES = [
  {
    field: 'useJobDescription',
    label: 'Job Description',
    hint: 'Use JD to create role-specific questions.',
    icon: FileText,
  },
  {
    field: 'useResume',
    label: 'Resume',
    hint: 'Use the candidate resume to personalize questions.',
    icon: UserRound,
  },
  {
    field: 'useCompanyInfo',
    label: 'Company Info',
    hint: 'Use company details during the interview.',
    icon: Building2,
  },
  {
    field: 'useCustomDocs',
    label: 'Custom Documents',
    hint: 'Use uploaded documents as extra context.',
    icon: FolderOpen,
  },
];

const inputClass = 'h-10 rounded-lg border-slate-200 bg-white text-sm shadow-none';

function titleCase(value, fallback) {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function Field({ label, hint, required, info, className = '', children }) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="inline-flex items-center gap-1 text-[13px] font-medium text-slate-700">
        {label}
        {required ? <span className="text-red-500">*</span> : null}
        {info ? <Info className="h-3.5 w-3.5 text-slate-400" title={info} /> : null}
      </Label>
      {children}
      {hint ? <p className="text-xs text-slate-400">{hint}</p> : null}
    </div>
  );
}

function SectionTitle({ icon: Icon, number, title, description }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-base font-semibold text-slate-900">
          {number ? <span className="mr-1.5 text-slate-400">{number}.</span> : null}
          {title}
        </h3>
        {description ? <p className="mt-0.5 text-sm text-slate-500">{description}</p> : null}
      </div>
    </div>
  );
}

function formatTime(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return value || '—';
  const [hour, minute] = value.split(':').map(Number);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = ((hour + 11) % 12) + 1;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${suffix}`;
}

function formatWorkingDays(days) {
  if (!Array.isArray(days) || days.length === 0) return 'Not set';
  const ordered = DAYS.filter((day) => days.includes(day.key));
  const keys = ordered.map((day) => day.key).join(',');
  if (keys === 'mon,tue,wed,thu,fri') return 'Monday - Friday';
  if (keys === 'mon,tue,wed,thu,fri,sat,sun') return 'Monday - Sunday';
  if (ordered.length <= 2) return ordered.map((day) => day.label).join(', ');
  return `${ordered[0].label} - ${ordered[ordered.length - 1].label}`;
}

function ScoreSlider({ label, value, onChange, interactive }) {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_2.75rem] items-center gap-x-3 gap-y-1">
      <span className="text-sm text-slate-700">{label}</span>
      <span className="text-right text-sm font-semibold tabular-nums text-slate-800">{pct}%</span>
      <div className="relative col-span-2 flex h-4 items-center">
        <div className="absolute inset-x-0 h-2 rounded-full bg-slate-100" />
        <div
          className="absolute left-0 h-2 rounded-full bg-brand-500"
          style={{ width: `${pct}%` }}
        />
        {interactive ? (
          <span
            className="pointer-events-none absolute top-1/2 z-[1] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-brand-500 bg-white shadow-sm"
            style={{ left: `${pct}%` }}
          />
        ) : null}
        <input
          type="range"
          min="0"
          max="100"
          value={pct}
          disabled={!interactive}
          onChange={(e) => onChange?.(e.target.value)}
          className="absolute inset-0 z-10 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-default [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-transparent [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-transparent"
        />
      </div>
    </div>
  );
}

function HelpBanner() {
  return (
    <Card className="min-w-0 flex-1 border-slate-200 shadow-sm">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600">
            <Headset className="h-4 w-4" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">Need Help?</p>
            <p className="text-sm text-slate-500">
              If you need any help to configure your organization settings, please contact our support team.
            </p>
          </div>
        </div>
        <Button
          asChild
          variant="outline"
          className="h-9 shrink-0 rounded-lg border-brand-500 font-semibold text-brand-600 hover:bg-brand-50"
        >
          <Link to="/admin/support">Contact Support</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
function ToggleRow({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium text-slate-800">{label}</div>
        {description ? <div className="mt-0.5 text-xs text-slate-500">{description}</div> : null}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? 'bg-brand-600' : 'bg-slate-200'}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${checked ? 'left-5' : 'left-0.5'}`}
        />
      </button>
    </div>
  );
}

function buildGeneralForm(organization) {
  const settings = organization?.settings || {};
  return {
    organizationName: organization?.organizationName || '',
    organizationEmail: organization?.organizationEmail || '',
    industry: organization?.industry || '',
    companySize: organization?.companySize || '',
    countryName: organization?.country?.name || '',
    website: organization?.website || '',
    phone: organization?.phone || '',
    timezone: organization?.timezone || 'UTC',
    workingHoursStart: organization?.workingHoursStart || '09:00',
    workingHoursEnd: organization?.workingHoursEnd || '18:00',
    workingDays: Array.isArray(organization?.workingDays) ? [...organization.workingDays] : [],
    organizationDisplayName: settings.displayName || '',
  };
}

function buildAiForm(organization) {
  const settings = organization?.settings || {};
  return {
    followUpEnabled: settings.followUpEnabled ?? true,
    interviewLanguage: settings.interviewLanguage === 'en' ? 'English' : (settings.interviewLanguage || 'English'),
    interviewStyle: titleCase(settings.interviewStyle, 'Balanced'),
    questionDifficulty: titleCase(settings.questionDifficulty, 'Medium'),
    realtimeTranscription: settings.realtimeTranscription ?? true,
    silenceTimeoutSec: settings.silenceTimeoutSec ?? 10,
    useJobDescription: settings.useJobDescription ?? true,
    useResume: settings.useResume ?? false,
    useCompanyInfo: settings.useCompanyInfo ?? false,
    useCustomDocs: settings.useCustomDocs ?? false,
    allowInternetKnowledge: settings.allowInternetKnowledge ?? true,
    maxSources: settings.maxSources ?? 5,
    scoringMode: settings.scoringMode || 'default',
    scoreTechnical: settings.scoreTechnical ?? 40,
    scoreCommunication: settings.scoreCommunication ?? 20,
    scoreProblemSolving: settings.scoreProblemSolving ?? 20,
    scoreExperience: settings.scoreExperience ?? 10,
    scoreOthers: settings.scoreOthers ?? 10,
    useConversationalMemory: settings.useConversationalMemory ?? true,
    maintainContext: settings.maintainContext ?? true,
    adaptQuestions: settings.adaptQuestions ?? true,
    beConcise: settings.beConcise ?? false,
    encourageDetailedAnswers: settings.encourageDetailedAnswers ?? true,
    voiceId: settings.voiceId || '',
  };
}

function normalizeGeneralForm(form) {
  return {
    ...form,
    workingDays: [...(form.workingDays || [])].sort(),
  };
}

export function OrgSettingsForm() {
  const dispatch = useDispatch();
  const { organization, billing, saving, logoUploading, voices, voicesLoading } = useSelector(selectAdminOrg);
  const [activeTab, setActiveTab] = useState('general');
  const [generalForm, setGeneralForm] = useState(null);
  const [aiForm, setAiForm] = useState(null);
  const [logoBroken, setLogoBroken] = useState(false);
  const [reloadConfirmOpen, setReloadConfirmOpen] = useState(false);
  const logoInputRef = useRef(null);

  useEffect(() => {
    dispatch(fetchMyOrganization());
  }, [dispatch]);

  useEffect(() => {
    if (!organization) return;
    setGeneralForm(buildGeneralForm(organization));
    setAiForm(buildAiForm(organization));
  }, [organization]);

  useEffect(() => {
    setLogoBroken(false);
  }, [organization?.logoUrl]);

  useEffect(() => {
    if (activeTab !== 'ai') return;
    if (Array.isArray(voices) && voices.length > 0) return;
    dispatch(fetchVoices());
  }, [activeTab, dispatch, voices]);

  const timezoneOptions = useMemo(() => {
    const current = generalForm?.timezone;
    if (current && !TIMEZONES.includes(current)) return [current, ...TIMEZONES];
    return TIMEZONES;
  }, [generalForm?.timezone]);

  const industryOptions = useMemo(() => {
    const current = generalForm?.industry;
    if (current && !INDUSTRIES.includes(current)) return [current, ...INDUSTRIES];
    return INDUSTRIES;
  }, [generalForm?.industry]);

  const sizeOptions = useMemo(() => {
    const current = generalForm?.companySize;
    if (current && !COMPANY_SIZES.includes(current)) return [current, ...COMPANY_SIZES];
    return COMPANY_SIZES;
  }, [generalForm?.companySize]);

  const isDirty = useMemo(() => {
    if (!organization || !generalForm || !aiForm) return false;
    const savedGeneral = normalizeGeneralForm(buildGeneralForm(organization));
    const currentGeneral = normalizeGeneralForm(generalForm);
    const savedAi = buildAiForm(organization);
    return (
      JSON.stringify(currentGeneral) !== JSON.stringify(savedGeneral) ||
      JSON.stringify(aiForm) !== JSON.stringify(savedAi)
    );
  }, [organization, generalForm, aiForm]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (!isDirty || reloadConfirmOpen) return;

      const isRefreshKey =
        event.key === 'F5' ||
        ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'r');

      if (!isRefreshKey) return;

      event.preventDefault();
      event.stopPropagation();
      setReloadConfirmOpen(true);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isDirty, reloadConfirmOpen]);

  if (!generalForm || !aiForm) {
    return <p className="text-sm text-muted">Loading settings...</p>;
  }

  const logoSrc = resolveAssetUrl(organization?.logoUrl);
  const showLogo = Boolean(logoSrc) && !logoBroken;
  const voiceOptions = Array.isArray(voices) ? voices : [];
  const isSingleVoice = voiceOptions.length === 1;
  const selectedVoice = voiceOptions.find((v) => v.voiceId === aiForm.voiceId) || null;
  const scoringTotal =
    Number(aiForm.scoreTechnical || 0) +
    Number(aiForm.scoreCommunication || 0) +
    Number(aiForm.scoreProblemSolving || 0) +
    Number(aiForm.scoreExperience || 0) +
    Number(aiForm.scoreOthers || 0);

  const planName = billing?.currentPlan?.planName || '—';
  const renewalDate = billing?.currentPlan?.renewalDate
    ? new Date(billing.currentPlan.renewalDate).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';
  const memberSince = organization?.createdAt
    ? new Date(organization.createdAt).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  const onGeneralChange = (field) => (e) =>
    setGeneralForm((s) => ({ ...s, [field]: e.target.value }));

  const setGeneralField = (field, value) => setGeneralForm((s) => ({ ...s, [field]: value }));
  const setAiField = (field, value) => setAiForm((s) => ({ ...s, [field]: value }));
  const setAiToggle = (field, value) => setAiForm((s) => ({ ...s, [field]: value }));

  const setScoringMode = (mode) => {
    setAiForm((s) => ({
      ...s,
      scoringMode: mode,
      ...(mode === 'default' ? DEFAULT_SCORES : null),
    }));
  };

  const previewVoice = () => {
    const url = selectedVoice?.previewUrl;
    if (!url) {
      toast.error('Preview not available for this voice');
      return;
    }
    const audio = new Audio(url);
    audio.play().catch(() => toast.error('Could not play voice preview'));
  };

  const toggleWorkingDay = (dayKey) => {
    setGeneralForm((s) => {
      const has = (s.workingDays || []).includes(dayKey);
      return {
        ...s,
        workingDays: has
          ? s.workingDays.filter((d) => d !== dayKey)
          : [...(s.workingDays || []), dayKey],
      };
    });
  };

  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await dispatch(uploadOrgLogo(file));
    if (uploadOrgLogo.fulfilled.match(result)) toast.success('Logo uploaded');
    else toast.error(result.payload || 'Logo upload failed');
  };

  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      displayName: generalForm.organizationDisplayName,
      organizationEmail: generalForm.organizationEmail,
      industry: generalForm.industry,
      companySize: generalForm.companySize,
      website: generalForm.website || null,
      phone: generalForm.phone,
      timezone: generalForm.timezone,
      workingHoursStart: generalForm.workingHoursStart || null,
      workingHoursEnd: generalForm.workingHoursEnd || null,
      workingDays: generalForm.workingDays?.length ? generalForm.workingDays : null,
    };

    const result = await dispatch(updateOrgSettings(payload));
    if (updateOrgSettings.fulfilled.match(result)) toast.success('General settings saved');
    else toast.error(result.payload || 'Failed to save general settings');
  };

  const handleAiSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      followUpEnabled: aiForm.followUpEnabled,
      interviewLanguage: aiForm.interviewLanguage,
      interviewStyle: aiForm.interviewStyle,
      questionDifficulty: aiForm.questionDifficulty,
      realtimeTranscription: aiForm.realtimeTranscription,
      silenceTimeoutSec: Number(aiForm.silenceTimeoutSec),
      useJobDescription: aiForm.useJobDescription,
      useResume: aiForm.useResume,
      useCompanyInfo: aiForm.useCompanyInfo,
      useCustomDocs: aiForm.useCustomDocs,
      allowInternetKnowledge: aiForm.allowInternetKnowledge,
      maxSources: Number(aiForm.maxSources),
      scoringMode: aiForm.scoringMode,
      scoreTechnical: Number(aiForm.scoreTechnical),
      scoreCommunication: Number(aiForm.scoreCommunication),
      scoreProblemSolving: Number(aiForm.scoreProblemSolving),
      scoreExperience: Number(aiForm.scoreExperience),
      scoreOthers: Number(aiForm.scoreOthers),
      useConversationalMemory: aiForm.useConversationalMemory,
      maintainContext: aiForm.maintainContext,
      adaptQuestions: aiForm.adaptQuestions,
      beConcise: aiForm.beConcise,
      encourageDetailedAnswers: aiForm.encourageDetailedAnswers,
      voiceId: aiForm.voiceId || null,
    };

    const result = await dispatch(updateAiPreferences(payload));
    if (updateAiPreferences.fulfilled.match(result)) toast.success('AI preferences saved');
    else toast.error(result.payload || 'Failed to save AI preferences');
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building2 },
    { id: 'ai', label: 'AI Preferences', icon: Sparkles },
  ];

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">Organization Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          {activeTab === 'general'
            ? 'Manage your organization preferences and basic information.'
            : 'Configure AI behavior and interview preferences.'}
        </p>
      </div>

      <div className="flex gap-6 border-b border-slate-200">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`-mb-px inline-flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
                active
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'general' && (
        <form onSubmit={handleGeneralSubmit}>
          <div className="grid w-full items-start gap-5 lg:grid-cols-[minmax(0,1.72fr)_minmax(300px,1fr)]">
            <div className="space-y-5">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-5 pt-5">
                  <SectionTitle
                    icon={Building2}
                    title="Company Information"
                    description="Update your company's basic details."
                  />
                </CardHeader>
                <CardContent className="grid gap-x-5 gap-y-4 px-6 pb-6 pt-0 md:grid-cols-2">
                  <Field label="Organization Name" required>
                    <Input value={generalForm.organizationName} readOnly required className={inputClass} />
                  </Field>
                  <Field
                    label="Organization Email"
                    required
                    hint="This email will be used for important notifications."
                  >
                    <Input
                      value={generalForm.organizationEmail}
                      onChange={onGeneralChange('organizationEmail')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Industry">
                    <FormSelect
                      value={generalForm.industry}
                      onValueChange={(value) => setGeneralField('industry', value)}
                      placeholder="Select industry"
                      options={industryOptions.map((item) => ({ value: item, label: item }))}
                    />
                  </Field>
                  <Field label="Company Size">
                    <FormSelect
                      value={generalForm.companySize}
                      onValueChange={(value) => setGeneralField('companySize', value)}
                      placeholder="Select size"
                      options={sizeOptions.map((item) => ({ value: item, label: item }))}
                    />
                  </Field>
                  <Field label="Country">
                    <Input value={generalForm.countryName} readOnly disabled className={inputClass} />
                  </Field>
                  <Field label="Website (Optional)">
                    <Input
                      value={generalForm.website}
                      onChange={onGeneralChange('website')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Phone Number" required>
                    <Input
                      value={generalForm.phone}
                      onChange={onGeneralChange('phone')}
                      required
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Organization Display Name">
                    <Input
                      value={generalForm.organizationDisplayName}
                      onChange={onGeneralChange('organizationDisplayName')}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Timezone" className="md:col-span-2">
                    <FormSelect
                      value={generalForm.timezone}
                      onValueChange={(value) => setGeneralField('timezone', value)}
                      options={timezoneOptions.map((zone) => ({ value: zone, label: zone }))}
                    />
                  </Field>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-5 pt-5">
                  <SectionTitle
                    icon={Clock3}
                    title="Basic Working Hours"
                    description="Default operating window for this organization."
                  />
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
                        <CalendarDays className="h-4 w-4 text-emerald-500" />
                        Working Days
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatWorkingDays(generalForm.workingDays)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2 text-[13px] font-medium text-slate-500">
                        <Clock3 className="h-4 w-4 text-sky-500" />
                        Working Hours
                      </div>
                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        {formatTime(generalForm.workingHoursStart)} - {formatTime(generalForm.workingHoursEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const active = generalForm.workingDays.includes(day.key);
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
                          {day.short}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="time"
                      value={generalForm.workingHoursStart}
                      onChange={onGeneralChange('workingHoursStart')}
                      className={inputClass}
                    />
                    <Input
                      type="time"
                      value={generalForm.workingHoursEnd}
                      onChange={onGeneralChange('workingHoursEnd')}
                      className={inputClass}
                    />
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-slate-600">
                    <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
                    These hours are used as the default operating window for scheduling and outreach.
                  </div>
                </CardContent>
              </Card>

              <div>
                <Button type="submit" disabled={saving} className="h-10 rounded-lg px-5 text-sm">
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>

            <div className="space-y-5">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={ImagePlus} title="Organization Logo" />
                </CardHeader>
                <CardContent className="px-6 pb-6 pt-0">
                  <div className="flex flex-col items-center rounded-xl border-2 border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-center">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white">
                      {showLogo ? (
                        <img
                          key={logoSrc}
                          src={logoSrc}
                          alt="Organization logo"
                          className="h-full w-full object-contain p-1.5"
                          onError={() => setLogoBroken(true)}
                        />
                      ) : (
                        <Building2 className="h-8 w-8 text-brand-500" />
                      )}
                    </div>
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
                      className="mt-4 h-9 rounded-lg border-brand-500 bg-white px-4 font-semibold text-brand-600 hover:bg-brand-50"
                      disabled={logoUploading}
                      onClick={() => logoInputRef.current?.click()}
                    >
                      {logoUploading ? 'Uploading…' : showLogo ? 'Change Logo' : 'Upload Logo'}
                    </Button>
                    <p className="mt-2 text-xs text-slate-400">PNG, JPG or WebP (Max. 2MB)</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Info} title="Organization Details" />
                </CardHeader>
                <CardContent className="px-6 pb-4 pt-0 text-sm">
                  {[
                    { label: 'Organization ID', value: organization?.organizationId || '—' },
                    { label: 'Account Type', value: planName === '—' ? '—' : 'Paid' },
                    { label: 'Current Plan', value: planName },
                    { label: 'Member Since', value: memberSince },
                    { label: 'Plan Renewal', value: renewalDate },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      className={`flex items-start justify-between gap-4 py-3 ${index === 0 ? '' : 'border-t border-slate-100'}`}
                    >
                      <span className="text-slate-500">{item.label}</span>
                      <span className="max-w-[58%] break-all text-right font-medium text-slate-800">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'ai' && (
        <form onSubmit={handleAiSubmit} className="w-full space-y-5">
          <div className="grid w-full items-start gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-5">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Bot} number="1" title="AI Model Preferences" />
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <Field label="Primary LLM">
                      <FormSelect
                        value={LLM_PRIMARY.value}
                        options={[LLM_PRIMARY]}
                        disabled
                        leading={<Bot className="h-4 w-4 text-brand-500" />}
                      />
                    </Field>
                    <Field label="Backup LLM">
                      <FormSelect
                        value={LLM_SECONDARY.value}
                        options={[LLM_SECONDARY]}
                        disabled
                        leading={<Sparkles className="h-4 w-4 text-brand-500" />}
                      />
                    </Field>
                  </div>
                  <ToggleRow
                    label="Enable Follow-up Questions"
                    description="AI will ask follow-up questions based on candidate responses."
                    checked={aiForm.followUpEnabled}
                    onChange={(value) => setAiToggle('followUpEnabled', value)}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Languages} number="2" title="Interview Preferences" />
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                    <Field label="Default Interview Language">
                      <FormSelect
                        value="English"
                        options={[{ value: 'English', label: 'English' }]}
                        disabled
                      />
                    </Field>
                    <Field label="Interview Style">
                      <FormSelect
                        value={aiForm.interviewStyle}
                        onValueChange={(value) => setAiField('interviewStyle', value)}
                        options={INTERVIEW_STYLES}
                      />
                    </Field>
                    <Field label="Question Difficulty">
                      <FormSelect
                        value={aiForm.questionDifficulty}
                        onValueChange={(value) => setAiField('questionDifficulty', value)}
                        options={DIFFICULTIES}
                      />
                    </Field>
                  </div>
                  <div className="grid min-w-0 items-end gap-4 sm:grid-cols-2">
                    <ToggleRow
                      label="Enable Real-time Transcription"
                      checked={aiForm.realtimeTranscription}
                      onChange={(value) => setAiToggle('realtimeTranscription', value)}
                    />
                    <Field
                      label="Silence Timeout"
                      hint="End response if candidate is silent."
                    >
                      <FormSelect
                        value={String(aiForm.silenceTimeoutSec)}
                        onValueChange={(value) => setAiField('silenceTimeoutSec', value)}
                        options={SILENCE_TIMEOUTS}
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Globe2} number="3" title="Content & Knowledge" />
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <div>
                    <p className="mb-2 text-[13px] font-medium text-slate-700">Select Sources</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {KNOWLEDGE_SOURCES.map(({ field, label, hint, icon: Icon }) => {
                        const active = aiForm[field];
                        return (
                          <button
                            key={field}
                            type="button"
                            onClick={() => setAiToggle(field, !active)}
                            className={`flex min-h-[76px] items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                              active
                                ? 'border-brand-500 bg-brand-50/40 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.35)]'
                                : 'border-slate-200 bg-white hover:border-slate-300'
                            }`}
                          >
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              active ? 'bg-brand-100 text-brand-600' : 'bg-slate-50 text-slate-500'
                            }`}>
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-sm font-semibold text-slate-800">{label}</span>
                              <span className="mt-0.5 block text-xs leading-snug text-slate-500">{hint}</span>
                            </span>
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              active
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}>
                              {active ? <Check className="h-3 w-3" strokeWidth={3} /> : null}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="grid min-w-0 items-end gap-4 sm:grid-cols-2">
                    <ToggleRow
                      label="Allow AI to use internet knowledge"
                      checked={aiForm.allowInternetKnowledge}
                      onChange={(value) => setAiToggle('allowInternetKnowledge', value)}
                    />
                    <Field
                      label="Maximum Sources"
                      info="How many knowledge sources the AI can use in one interview."
                    >
                      <FormSelect
                        value={String(aiForm.maxSources)}
                        onValueChange={(value) => setAiField('maxSources', value)}
                        options={MAX_SOURCES}
                      />
                    </Field>
                  </div>
                </CardContent>
              </Card>

              <Button type="submit" disabled={saving} className="h-10 w-fit rounded-lg px-5 text-sm">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>

            <div className="min-w-0 space-y-5">
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="flex flex-col gap-3 px-6 pb-4 pt-5 sm:flex-row sm:items-start sm:justify-between">
                  <SectionTitle icon={BrainCircuit} number="4" title="Scoring Preferences" />
                  <div className="flex shrink-0 rounded-lg bg-slate-100 p-1">
                    {['default', 'custom'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setScoringMode(mode)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          aiForm.scoringMode === mode
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {mode === 'default' ? 'Default Scoring' : 'Custom Scoring'}
                      </button>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  {[
                    ['Technical Skills', 'scoreTechnical'],
                    ['Communication', 'scoreCommunication'],
                    ['Problem Solving', 'scoreProblemSolving'],
                    ['Experience Relevance', 'scoreExperience'],
                    ['Others', 'scoreOthers'],
                  ].map(([label, field]) => (
                    <ScoreSlider
                      key={field}
                      label={label}
                      value={aiForm[field]}
                      interactive={aiForm.scoringMode === 'custom'}
                      onChange={(value) => setAiField(field, value)}
                    />
                  ))}
                  <div className="flex items-center justify-end gap-3 pt-1 text-sm">
                    <span className="font-medium text-slate-500">Total</span>
                    <span className={`w-10 text-right font-semibold tabular-nums ${
                      scoringTotal === 100 ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {scoringTotal}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Sparkles} number="5" title="AI Behavior Settings" />
                </CardHeader>
                <CardContent className="divide-y divide-slate-100 px-6 pb-6 pt-0">
                  {[
                    ['Use Conversational Memory', 'useConversationalMemory'],
                    ['Maintain Context Across Questions', 'maintainContext'],
                    ['Adapt Questions Based on Answers', 'adaptQuestions'],
                    ['Be Concise and Focused', 'beConcise'],
                    ['Encourage Detailed Answers', 'encourageDetailedAnswers'],
                  ].map(([label, field]) => (
                    <div key={field} className="py-3 first:pt-0 last:pb-0">
                      <ToggleRow
                        label={label}
                        checked={aiForm[field]}
                        onChange={(value) => setAiToggle(field, value)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="px-6 pb-4 pt-5">
                  <SectionTitle icon={Mic} number="6" title="Language & Voice (For AI Calls)" />
                </CardHeader>
                <CardContent className="space-y-4 px-6 pb-6 pt-0">
                  <Field label="Voice Provider">
                    <div className="flex h-10 items-center justify-between rounded-lg border border-slate-200 bg-white px-3">
                      <span className="text-sm font-medium text-slate-800">ElevenLabs</span>
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                        Connected
                      </span>
                    </div>
                  </Field>
                  <Field label="AI Voice">
                    <div className="flex min-w-0 gap-2">
                      {voicesLoading ? (
                        <p className="flex h-10 min-w-0 flex-1 items-center text-sm text-slate-500">Loading voices…</p>
                      ) : isSingleVoice ? (
                        <Input
                          value={selectedVoice?.name || aiForm.voiceId}
                          readOnly
                          className={`${inputClass} min-w-0 flex-1`}
                        />
                      ) : (
                        <div className="min-w-0 flex-1">
                          <FormSelect
                            value={aiForm.voiceId}
                            onValueChange={(value) => setAiField('voiceId', value)}
                            placeholder="Select a voice"
                            options={voiceOptions.map((v) => ({ value: v.voiceId, label: v.name }))}
                          />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 shrink-0 gap-1.5 border-brand-500 px-3 font-semibold text-brand-600"
                        onClick={previewVoice}
                        disabled={!aiForm.voiceId}
                      >
                        <Play className="h-3.5 w-3.5" />
                        Preview Voice
                      </Button>
                    </div>
                  </Field>
                </CardContent>
              </Card>
            </div>
          </div>

          <HelpBanner />
        </form>
      )}

      {activeTab === 'general' && <HelpBanner />}

      <ConfirmDialog
        open={reloadConfirmOpen}
        title="Unsaved changes"
        description="You have unsaved changes in Organization Settings. If you reload now, those changes will be lost."
        confirmLabel="Reload"
        cancelLabel="Cancel"
        variant="danger"
        onOpenChange={setReloadConfirmOpen}
        onConfirm={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
