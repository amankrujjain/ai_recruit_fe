import { EmploymentType } from '@/lib/employmentType';

export const EXPERIENCE_MAX_CAP = 15;

export const emptyJobForm = {
  jobTitle: '',
  jobDescription: '',
  experienceMin: 0,
  experienceMax: 5,
  salaryMin: '',
  salaryMax: '',
  location: [],
  employmentType: EmploymentType.FULL_TIME,
  mandatorySkills: [],
  preferredSkills: [],
};

export function jobToForm(job) {
  if (!job) return { ...emptyJobForm };
  return {
    jobTitle: job.jobTitle || '',
    jobDescription: job.jobDescription || '',
    experienceMin: job.experienceMin ?? 0,
    experienceMax: job.experienceMax ?? 5,
    salaryMin: job.salaryMin ?? '',
    salaryMax: job.salaryMax ?? '',
    location: job.location || [],
    employmentType: job.employmentType || EmploymentType.FULL_TIME,
    mandatorySkills: job.mandatorySkills || [],
    preferredSkills: job.preferredSkills || [],
  };
}

export function formToPayload(form) {
  return {
    jobTitle: form.jobTitle.trim(),
    jobDescription: form.jobDescription.trim(),
    experienceMin: Number(form.experienceMin),
    experienceMax: Number(form.experienceMax),
    salaryMin: form.salaryMin === '' ? undefined : Number(form.salaryMin),
    salaryMax: form.salaryMax === '' ? undefined : Number(form.salaryMax),
    location: form.location,
    employmentType: form.employmentType,
    mandatorySkills: form.mandatorySkills,
    preferredSkills: form.preferredSkills,
  };
}

export function validateRoleDetails(form) {
  if (!form.jobTitle.trim()) return 'Job title is required';
  if (!form.location?.length) return 'Add at least one location';
  const min = Number(form.experienceMin);
  const max = Number(form.experienceMax);
  if (Number.isNaN(min) || min < 0) return 'Min experience must be 0 or more';
  if (Number.isNaN(max) || max < 0) return 'Max experience must be 0 or more';
  if (min > EXPERIENCE_MAX_CAP || max > EXPERIENCE_MAX_CAP) {
    return `Experience cannot exceed ${EXPERIENCE_MAX_CAP} years`;
  }
  if (max < min) return 'Max experience must be greater than or equal to min';
  if (
    form.salaryMin !== ''
    && form.salaryMax !== ''
    && Number(form.salaryMax) < Number(form.salaryMin)
  ) {
    return 'Max salary must be greater than or equal to min';
  }
  return null;
}

export function validateRequirements(form) {
  if (!form.jobDescription.trim() || form.jobDescription.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (!form.mandatorySkills?.length) return 'Add at least one mandatory skill';
  return null;
}
