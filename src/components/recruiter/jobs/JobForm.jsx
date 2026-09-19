import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { EmploymentType, employmentTypeLabels } from '@/lib/employmentType';
import { AiRoundType, aiRoundTypeLabels } from '@/lib/aiRoundType';
import { getMyOrganizationRequest, getVoicesRequest } from '@/api/adminOrgApi';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CreateJobStepper } from '@/components/recruiter/jobs/CreateJobStepper';
import { JobAgentSetup } from '@/components/recruiter/jobs/JobAgentSetup';
import {
  EXPERIENCE_MAX_CAP,
  MAX_ROUNDS,
  defaultRounds,
  emptyJobForm,
  formToPayload,
  isJobFormDirty,
  jobToForm,
  validateAiSetup,
  validateRoleDetails,
} from '@/components/recruiter/jobs/jobFormDraft';
import { voiceToAgentFields } from '@/lib/voiceAgent';

function StepActions({
  onBack,
  onNext,
  onCancel,
  nextLabel,
  nextDisabled,
  showBack,
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 border-t border-border pt-6">
      <div>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {showBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
            Back
          </Button>
        )}
        <Button type="button" disabled={nextDisabled} onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  );
}

function RoleDetailsFields({ form, setForm }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input
          id="jobTitle"
          value={form.jobTitle}
          onChange={set('jobTitle')}
          placeholder="e.g. Senior React Engineer"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="employmentType">Employment type</Label>
        <Select
          id="employmentType"
          value={form.employmentType}
          onChange={set('employmentType')}
        >
          {Object.values(EmploymentType).map((t) => (
            <option key={t} value={t}>
              {employmentTypeLabels[t]}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Locations (press Enter to add)</Label>
        <TagInput
          value={form.location}
          onChange={(tags) => setForm((prev) => ({ ...prev, location: tags }))}
          placeholder="Add a location…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="experienceMin">Min experience (years)</Label>
          <Input
            id="experienceMin"
            type="number"
            min={0}
            max={EXPERIENCE_MAX_CAP}
            value={form.experienceMin}
            onChange={set('experienceMin')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experienceMax">Max experience (years)</Label>
          <Input
            id="experienceMax"
            type="number"
            min={0}
            max={EXPERIENCE_MAX_CAP}
            value={form.experienceMax}
            onChange={set('experienceMax')}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Salary range (₹ LPA, optional)</Label>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="salaryMin"
            type="number"
            min={0}
            value={form.salaryMin}
            onChange={set('salaryMin')}
            placeholder="Min e.g. 18"
            aria-label="Salary min"
          />
          <Input
            id="salaryMax"
            type="number"
            min={0}
            value={form.salaryMax}
            onChange={set('salaryMax')}
            placeholder="Max e.g. 30"
            aria-label="Salary max"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="jobDescription">Description</Label>
        <textarea
          id="jobDescription"
          className="min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
          value={form.jobDescription}
          onChange={set('jobDescription')}
          placeholder="Describe the role, responsibilities, and must-haves…"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="mandatorySkills">Mandatory skills</Label>
        <TagInput
          value={form.mandatorySkills}
          onChange={(tags) => setForm((prev) => ({ ...prev, mandatorySkills: tags }))}
          placeholder="Type a skill and press Enter"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferredSkills">Preferred skills</Label>
        <TagInput
          value={form.preferredSkills}
          onChange={(tags) => setForm((prev) => ({ ...prev, preferredSkills: tags }))}
          placeholder="Type a skill and press Enter"
        />
      </div>
    </div>
  );
}

function AiSetupFields({ form, setForm, voices, voicesLoading }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const updateRound = (index, key, value) => setForm((f) => ({
    ...f,
    rounds: f.rounds.map((round, i) => (i === index ? { ...round, [key]: value } : round)),
  }));
  const addRound = () => setForm((f) => (
    f.rounds.length >= MAX_ROUNDS
      ? f
      : {
        ...f,
        rounds: [
          ...f.rounds,
          { name: `Round ${f.rounds.length + 1}`, roundType: AiRoundType.AI_CALL, minimumPassScore: 70, config: {} },
        ],
      }
  ));
  const removeRound = (index) => setForm((f) => (
    f.rounds.length <= 1
      ? f
      : { ...f, rounds: f.rounds.filter((_, i) => i !== index) }
  ));

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI rounds</h3>
            <p className="mt-0.5 text-xs text-muted">Candidates progress through these rounds in order.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRound}
            disabled={form.rounds.length >= MAX_ROUNDS}
          >
            Add round
          </Button>
        </div>
        <div className="space-y-2">
          {form.rounds.map((round, index) => (
            <div key={`${round.roundType}-${index}`} className="grid gap-2 sm:grid-cols-[1fr_160px_110px_auto]">
              <Input
                aria-label={`Round ${index + 1} name`}
                value={round.name}
                onChange={(e) => updateRound(index, 'name', e.target.value)}
              />
              <Select
                aria-label={`Round ${index + 1} type`}
                value={round.roundType}
                onChange={(e) => updateRound(index, 'roundType', e.target.value)}
              >
                {Object.values(AiRoundType).map((code) => (
                  <option key={code} value={code}>{aiRoundTypeLabels[code]}</option>
                ))}
              </Select>
              <Input
                type="number"
                min={0}
                max={100}
                aria-label={`Round ${index + 1} score`}
                value={round.minimumPassScore}
                onChange={(e) => updateRound(index, 'minimumPassScore', e.target.value === '' ? '' : Number(e.target.value))}
              />
              {form.rounds.length > 1 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => removeRound(index)}>
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-border p-4">
        <Label htmlFor="aiMatchThreshold">Maximum score for AI resume parsing (%)</Label>
        <Input
          id="aiMatchThreshold"
          type="number"
          min={0}
          max={100}
          value={form.aiMatchThreshold}
          onChange={set('aiMatchThreshold')}
        />
        <p className="text-xs text-muted">
          Candidates below this score cannot be invited to the first AI round.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Interview scoring rubric</h3>
            <p className="mt-0.5 text-xs text-muted">
              Criteria and weights for this job (must total 100%). Prefills from org defaults.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setForm((f) => ({
              ...f,
              scoringRubric: [
                ...(f.scoringRubric || []),
                { name: `Criterion ${(f.scoringRubric || []).length + 1}`, weight: 0 },
              ],
            }))}
          >
            Add criterion
          </Button>
        </div>
        <div className="space-y-2">
          {(form.scoringRubric || []).map((item, index) => (
            <div key={`rubric-${index}`} className="grid gap-2 sm:grid-cols-[1fr_110px_auto]">
              <Input
                aria-label={`Criterion ${index + 1} name`}
                value={item.name}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  scoringRubric: f.scoringRubric.map((row, i) => (
                    i === index ? { ...row, name: e.target.value } : row
                  )),
                }))}
              />
              <Input
                type="number"
                min={0}
                max={100}
                aria-label={`Criterion ${index + 1} weight`}
                value={item.weight}
                onChange={(e) => setForm((f) => ({
                  ...f,
                  scoringRubric: f.scoringRubric.map((row, i) => (
                    i === index
                      ? { ...row, weight: e.target.value === '' ? '' : Number(e.target.value) }
                      : row
                  )),
                }))}
              />
              {(form.scoringRubric || []).length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm((f) => ({
                    ...f,
                    scoringRubric: f.scoringRubric.filter((_, i) => i !== index),
                  }))}
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">
          Weights total:{' '}
          {(form.scoringRubric || []).reduce((acc, row) => acc + Number(row.weight || 0), 0)}
          /100
        </p>
      </div>

      <JobAgentSetup form={form} setForm={setForm} voices={voices} voicesLoading={voicesLoading} />
    </div>
  );
}

function ReviewSummary({ form }) {
  return (
    <dl className="space-y-4 text-sm">
      <div>
        <dt className="text-muted">Job title</dt>
        <dd className="mt-0.5 font-medium text-foreground">{form.jobTitle || '—'}</dd>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-muted">Employment type</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {employmentTypeLabels[form.employmentType] || form.employmentType}
          </dd>
        </div>
        <div>
          <dt className="text-muted">Experience</dt>
          <dd className="mt-0.5 font-medium text-foreground">
            {form.experienceMin}–{form.experienceMax} years
          </dd>
        </div>
      </div>
      <div>
        <dt className="text-muted">Locations</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {form.location?.length ? form.location.join(', ') : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-muted">Salary (₹ LPA)</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {form.salaryMin === '' && form.salaryMax === ''
            ? 'Not set'
            : `${form.salaryMin || '—'} – ${form.salaryMax || '—'}`}
        </dd>
      </div>
      <div>
        <dt className="text-muted">Mandatory skills</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {form.mandatorySkills?.length ? form.mandatorySkills.join(', ') : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-muted">Preferred skills</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {form.preferredSkills?.length ? form.preferredSkills.join(', ') : '—'}
        </dd>
      </div>
      <div>
        <dt className="text-muted">Description</dt>
        <dd className="mt-0.5 whitespace-pre-wrap text-foreground">
          {form.jobDescription || '—'}
        </dd>
      </div>
      <div>
        <dt className="text-muted">AI rounds</dt>
        <dd className="mt-2 space-y-1 font-medium text-foreground">
          {(form.rounds || []).map((round) => (
            <div key={round.name}>
              {round.name} · {aiRoundTypeLabels[round.roundType] || round.roundType} · pass {round.minimumPassScore}%
            </div>
          ))}
        </dd>
      </div>
      <div>
        <dt className="text-muted">CV / resume-parse score</dt>
        <dd className="mt-0.5 font-medium text-foreground">{form.aiMatchThreshold}%</dd>
      </div>
      <div>
        <dt className="text-muted">AI agent</dt>
        <dd className="mt-0.5 font-medium text-foreground">
          {form.voiceName || '—'} · {form.voiceGender || '—'} · {form.interviewLanguage || '—'} · {form.voiceAccent || '—'} · {form.voiceStyle || '—'}
        </dd>
      </div>
    </dl>
  );
}

const STEP_COPY = {
  1: {
    title: 'Job Details',
    subtitle: 'Step 1 of 3 — Tell us about the position.',
  },
  2: {
    title: 'AI setup',
    subtitle: 'Step 2 of 3 — Configure rounds, CV score, and the job-level agent.',
  },
  3: {
    title: 'Review',
    subtitle: 'Step 3 of 3 — Confirm details before creating the job.',
  },
};

const UNSAVED_COPY = 'There are unsaved data. Are you sure to quit?';

export function JobForm({ initial, saving, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => jobToForm(initial));
  const [voices, setVoices] = useState([]);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const [pendingHref, setPendingHref] = useState(null);
  const submittedRef = useRef(false);
  const baselineRef = useRef(jobToForm(initial || emptyJobForm));
  const dirty = !submittedRef.current && isJobFormDirty(form, baselineRef.current);

  useEffect(() => {
    if (initial) {
      const next = jobToForm(initial);
      setForm(next);
      baselineRef.current = next;
    }
  }, [initial]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setVoicesLoading(true);
      try {
        const [{ data: voiceData }, { data: orgData }] = await Promise.all([
          getVoicesRequest(),
          getMyOrganizationRequest(),
        ]);
        if (cancelled) return;
        const loadedVoices = voiceData?.data?.voices ?? [];
        setVoices(loadedVoices);
        const settings = orgData?.data?.settings || orgData?.data?.organizationSettings;
        setForm((current) => {
          let next = { ...current };
          if (!initial && settings && !(current.scoringRubric?.length > 0 && isJobFormDirty(current, baselineRef.current))) {
            const fromOrg = [
              { name: 'Technical Skills', weight: Number(settings.scoreTechnical ?? 40) },
              { name: 'Communication', weight: Number(settings.scoreCommunication ?? 20) },
              { name: 'Problem Solving', weight: Number(settings.scoreProblemSolving ?? 20) },
              { name: 'Experience Relevance', weight: Number(settings.scoreExperience ?? 10) },
              { name: 'Others', weight: Number(settings.scoreOthers ?? 10) },
            ];
            const sum = fromOrg.reduce((acc, row) => acc + row.weight, 0);
            if (sum === 100) next = { ...next, scoringRubric: fromOrg };
          }
          if (current.voiceId || !settings?.voiceId) {
            if (!isJobFormDirty(current, baselineRef.current)) baselineRef.current = next;
            return next;
          }
          const match = loadedVoices.find((voice) => voice.voiceId === settings.voiceId);
          next = match
            ? { ...next, ...voiceToAgentFields(match) }
            : {
              ...next,
              voiceId: settings.voiceId,
              voiceName: settings.voiceName || current.voiceName,
              interviewLanguage: settings.interviewLanguage || current.interviewLanguage,
            };
          if (!isJobFormDirty(current, baselineRef.current)) {
            baselineRef.current = next;
          }
          return next;
        });
      } catch {
        if (!cancelled) toast.error('Failed to load voices');
      } finally {
        if (!cancelled) setVoicesLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return undefined;
    const onClick = (event) => {
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.target === '_blank' || event.metaKey || event.ctrlKey) return;
      const url = new URL(anchor.href, window.location.origin);
      if (url.origin !== window.location.origin) return;
      if (`${url.pathname}${url.search}` === `${window.location.pathname}${window.location.search}`) return;
      event.preventDefault();
      event.stopPropagation();
      setPendingHref(`${url.pathname}${url.search}${url.hash}`);
      setQuitOpen(true);
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty]);

  const requestQuit = () => {
    if (!dirty) {
      onCancel?.();
      return;
    }
    setPendingHref(null);
    setQuitOpen(true);
  };

  const confirmQuit = () => {
    setQuitOpen(false);
    if (pendingHref) {
      window.location.assign(pendingHref);
      return;
    }
    onCancel?.();
  };

  const goNext = () => {
    if (step === 1) {
      const error = validateRoleDetails(form);
      if (error) {
        toast.error(error);
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      const error = validateAiSetup(form);
      if (error) {
        toast.error(error);
        return;
      }
      setStep(3);
    }
  };

  const handleCreate = () => {
    const roleError = validateRoleDetails(form);
    if (roleError) {
      toast.error(roleError);
      setStep(1);
      return;
    }
    const aiError = validateAiSetup(form);
    if (aiError) {
      toast.error(aiError);
      setStep(2);
      return;
    }
    submittedRef.current = true;
    onSubmit(formToPayload(form));
  };

  const copy = STEP_COPY[step];

  return (
    <div className="mx-auto w-full max-w-2xl">
      <CreateJobStepper currentStep={step} />

      <Card className="rounded-xl border-border shadow-sm shadow-brand-600/5">
        <CardContent className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">{copy.title}</h2>
            <p className="mt-1 text-sm text-muted">{copy.subtitle}</p>
          </div>

          {step === 1 && <RoleDetailsFields form={form} setForm={setForm} />}
          {step === 2 && (
            <AiSetupFields
              form={form}
              setForm={setForm}
              voices={voices}
              voicesLoading={voicesLoading}
            />
          )}
          {step === 3 && <ReviewSummary form={form} />}

          <StepActions
            onCancel={onCancel ? requestQuit : undefined}
            onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
            showBack={step > 1}
            onNext={step === 3 ? handleCreate : goNext}
            nextLabel={
              step === 3
                ? (saving ? 'Creating…' : 'Create job')
                : (
                  <>
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                  </>
                )
            }
            nextDisabled={saving && step === 3}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={quitOpen}
        title={UNSAVED_COPY}
        cancelLabel="Stay"
        confirmLabel="Quit"
        variant="danger"
        onCancel={() => {
          setQuitOpen(false);
          setPendingHref(null);
        }}
        onOpenChange={(open) => {
          if (!open) {
            setQuitOpen(false);
            setPendingHref(null);
          }
        }}
        onConfirm={confirmQuit}
      />
    </div>
  );
}

export { defaultRounds };
