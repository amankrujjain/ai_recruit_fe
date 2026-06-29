import { useState } from 'react';
import { EmploymentType, employmentTypeLabels } from '@/lib/employmentType';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';

const emptyForm = {
  jobTitle: '',
  jobDescription: '',
  experienceMin: 0,
  experienceMax: 5,
  salaryMin: '',
  salaryMax: '',
  location: '',
  employmentType: EmploymentType.FULL_TIME,
  mandatorySkills: '',
  preferredSkills: '',
};

function toForm(job) {
  if (!job) return { ...emptyForm };
  return {
    jobTitle: job.jobTitle || '',
    jobDescription: job.jobDescription || '',
    experienceMin: job.experienceMin ?? 0,
    experienceMax: job.experienceMax ?? 5,
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    location: job.location || '',
    employmentType: job.employmentType || EmploymentType.FULL_TIME,
    mandatorySkills: (job.mandatorySkills || []).join(', '),
    preferredSkills: (job.preferredSkills || []).join(', '),
  };
}

function parseSkills(value) {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function JobForm({ initial, saving, onSubmit, onCancel }) {
  const [form, setForm] = useState(() => toForm(initial));

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      jobTitle: form.jobTitle.trim(),
      jobDescription: form.jobDescription.trim(),
      experienceMin: Number(form.experienceMin),
      experienceMax: Number(form.experienceMax),
      salaryMin: form.salaryMin === '' ? undefined : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? undefined : Number(form.salaryMax),
      location: form.location.trim(),
      employmentType: form.employmentType,
      mandatorySkills: parseSkills(form.mandatorySkills),
      preferredSkills: parseSkills(form.preferredSkills),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="jobTitle">Job title</Label>
        <Input id="jobTitle" value={form.jobTitle} onChange={set('jobTitle')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="jobDescription">Description</Label>
        <textarea
          id="jobDescription"
          className="min-h-[120px] w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
          value={form.jobDescription}
          onChange={set('jobDescription')}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="experienceMin">Min experience (years)</Label>
          <Input id="experienceMin" type="number" min={0} value={form.experienceMin} onChange={set('experienceMin')} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experienceMax">Max experience (years)</Label>
          <Input id="experienceMax" type="number" min={0} value={form.experienceMax} onChange={set('experienceMax')} required />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">Salary min (optional)</Label>
          <Input id="salaryMin" type="number" min={0} value={form.salaryMin} onChange={set('salaryMin')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="salaryMax">Salary max (optional)</Label>
          <Input id="salaryMax" type="number" min={0} value={form.salaryMax} onChange={set('salaryMax')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">Location</Label>
        <Input id="location" value={form.location} onChange={set('location')} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="employmentType">Employment type</Label>
        <Select id="employmentType" value={form.employmentType} onChange={set('employmentType')}>
          {Object.values(EmploymentType).map((t) => (
            <option key={t} value={t}>{employmentTypeLabels[t]}</option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mandatorySkills">Mandatory skills (comma-separated)</Label>
        <Input id="mandatorySkills" value={form.mandatorySkills} onChange={set('mandatorySkills')} required placeholder="React, Node.js, SQL" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="preferredSkills">Preferred skills (comma-separated)</Label>
        <Input id="preferredSkills" value={form.preferredSkills} onChange={set('preferredSkills')} placeholder="TypeScript, AWS" />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save job'}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}
