import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { EmploymentType, employmentTypeLabels } from '@/lib/employmentType';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { TagInput } from '@/components/ui/TagInput';
import { CreateJobStepper } from '@/components/recruiter/jobs/CreateJobStepper';
import {
  EXPERIENCE_MAX_CAP,
  formToPayload,
  jobToForm,
  validateRequirements,
  validateRoleDetails,
} from '@/components/recruiter/jobs/jobFormDraft';

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
    </div>
  );
}

function RequirementsFields({ form, setForm }) {
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="space-y-5">
      <p className="rounded-lg bg-brand-50 px-3 py-2.5 text-xs text-slate-600">
        AI round configuration will land here next. For now, add the description and skills
        required to publish this job.
      </p>

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
    </dl>
  );
}

const STEP_COPY = {
  1: {
    title: 'Role details',
    subtitle: 'Step 1 of 3 — Tell us about the position.',
  },
  2: {
    title: 'AI round setup',
    subtitle: 'Step 2 of 3 — Add requirements (AI rounds coming soon).',
  },
  3: {
    title: 'Review & publish',
    subtitle: 'Step 3 of 3 — Confirm details before publishing.',
  },
};

export function JobForm({ initial, saving, onSubmit, onCancel }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => jobToForm(initial));

  useEffect(() => {
    if (initial) setForm(jobToForm(initial));
  }, [initial]);

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
      const error = validateRequirements(form);
      if (error) {
        toast.error(error);
        return;
      }
      setStep(3);
    }
  };

  const handlePublish = () => {
    const roleError = validateRoleDetails(form);
    if (roleError) {
      toast.error(roleError);
      setStep(1);
      return;
    }
    const reqError = validateRequirements(form);
    if (reqError) {
      toast.error(reqError);
      setStep(2);
      return;
    }
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
          {step === 2 && <RequirementsFields form={form} setForm={setForm} />}
          {step === 3 && <ReviewSummary form={form} />}

          <StepActions
            onCancel={onCancel}
            onBack={step > 1 ? () => setStep((s) => s - 1) : undefined}
            showBack={step > 1}
            onNext={step === 3 ? handlePublish : goNext}
            nextLabel={
              step === 3
                ? (saving ? 'Publishing…' : 'Publish')
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
    </div>
  );
}
