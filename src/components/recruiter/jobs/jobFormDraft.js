import { EmploymentType } from '@/lib/employmentType';
import { AiRoundType } from '@/lib/aiRoundType';
import { DEFAULT_AGENT_TONE, isHindiLanguage, isInterviewLanguage, normalizeInterviewLanguage } from '@/lib/voiceAgent';

export const EXPERIENCE_MAX_CAP = 15;
export const MAX_ROUNDS = 3;

export const DEFAULT_SCORING_RUBRIC = [
  { name: 'Technical Skills', weight: 40 },
  { name: 'Communication', weight: 20 },
  { name: 'Problem Solving', weight: 20 },
  { name: 'Experience Relevance', weight: 10 },
  { name: 'Others', weight: 10 },
];

export const defaultRounds = [
  {
    name: 'AI Call',
    roundType: AiRoundType.AI_CALL,
    minimumPassScore: 70,
    config: {},
  },
  {
    name: 'AI Screening',
    roundType: AiRoundType.AI_SCREENING,
    minimumPassScore: 70,
    config: {},
  },
];

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
  aiMatchThreshold: 80,
  scoringRubric: DEFAULT_SCORING_RUBRIC.map((item) => ({ ...item })),
  rounds: defaultRounds.map((round) => ({ ...round })),
  voiceId: '',
  voiceName: '',
  voiceGender: '',
  interviewLanguage: 'en',
  voiceAccent: '',
  voiceStyle: DEFAULT_AGENT_TONE,
  agentSnapshot: {},
};

const mapLegacyRounds = (job) => {
  if (job.rounds?.length) {
    return job.rounds.map((round) => ({
      name: round.name,
      roundType: round.roundType === 'AI' ? AiRoundType.AI_CALL : round.roundType,
      minimumPassScore: round.minimumPassScore ?? 70,
      config: round.config || {},
    }));
  }
  if (job.aiRounds?.length) {
    return job.aiRounds.map((round) => ({
      name: round.name,
      roundType: round.roundType === 'AI' ? AiRoundType.AI_CALL : (round.roundType || AiRoundType.AI_CALL),
      minimumPassScore: round.minimumPassScore ?? 70,
      config: round.config || {},
    }));
  }
  return defaultRounds.map((round) => ({ ...round }));
};

export function jobToForm(job) {
  if (!job) {
    return {
      ...emptyJobForm,
      rounds: defaultRounds.map((round) => ({ ...round })),
      scoringRubric: DEFAULT_SCORING_RUBRIC.map((item) => ({ ...item })),
    };
  }
  const rubric = Array.isArray(job.scoringRubric) && job.scoringRubric.length
    ? job.scoringRubric.map((item) => ({
      name: item.name || '',
      weight: Number(item.weight) || 0,
    }))
    : DEFAULT_SCORING_RUBRIC.map((item) => ({ ...item }));
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
    aiMatchThreshold: job.aiMatchThreshold ?? 80,
    scoringRubric: rubric,
    rounds: mapLegacyRounds(job),
    voiceId: job.voiceId || '',
    voiceName: job.voiceName || '',
    voiceGender: job.voiceGender || '',
    interviewLanguage: normalizeInterviewLanguage(job.interviewLanguage) || 'en',
    voiceAccent: job.voiceAccent || '',
    voiceStyle: job.voiceStyle || DEFAULT_AGENT_TONE,
    agentSnapshot: job.agentSnapshot && typeof job.agentSnapshot === 'object' ? job.agentSnapshot : {},
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
    aiMatchThreshold: Number(form.aiMatchThreshold),
    scoringRubric: (form.scoringRubric || []).map((item) => ({
      name: String(item.name || '').trim(),
      weight: Number(item.weight),
    })),
    rounds: (form.rounds || []).map((round) => ({
      name: round.name.trim(),
      roundType: round.roundType,
      minimumPassScore: Number(round.minimumPassScore),
      config: round.config || {},
    })),
    voiceProvider: 'ELEVENLABS',
    voiceId: form.voiceId,
    voiceName: form.voiceName,
    voiceGender: form.voiceGender,
    interviewLanguage: form.interviewLanguage,
    voiceAccent: form.voiceAccent,
    voiceStyle: form.voiceStyle,
    agentSnapshot: form.agentSnapshot || {},
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
  if (!form.jobDescription.trim() || form.jobDescription.trim().length < 10) {
    return 'Description must be at least 10 characters';
  }
  if (!form.mandatorySkills?.length) return 'Add at least one mandatory skill';
  return null;
}

export function validateAiSetup(form) {
  const rounds = form.rounds || [];
  if (!rounds.length) return 'Add at least one AI round';
  if (rounds.length > MAX_ROUNDS) return 'You can add at most 3 AI rounds';
  if (rounds.some((round) => !round.name?.trim())) return 'Add a name for every AI round';
  const names = rounds.map((round) => round.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) return 'Round names must be unique';
  const allowed = new Set(Object.values(AiRoundType));
  if (rounds.some((round) => !allowed.has(round.roundType))) {
    return 'Each round must be AI Call or AI Screening';
  }
  if (rounds.some((round) => {
    const score = Number(round.minimumPassScore);
    return round.minimumPassScore === '' || Number.isNaN(score) || score < 0 || score > 100 || !Number.isInteger(score);
  })) {
    return 'Each round score must be an integer between 0 and 100';
  }
  const threshold = Number(form.aiMatchThreshold);
  if (
    form.aiMatchThreshold === ''
    || Number.isNaN(threshold)
    || threshold < 0
    || threshold > 100
    || !Number.isInteger(threshold)
  ) {
    return 'CV match score must be an integer between 0 and 100';
  }
  const rubric = form.scoringRubric || [];
  if (!rubric.length) return 'Add at least one scoring criterion';
  if (rubric.some((item) => !String(item.name || '').trim())) {
    return 'Each scoring criterion needs a name';
  }
  const weightSum = rubric.reduce((acc, item) => acc + Number(item.weight || 0), 0);
  if (weightSum !== 100) return `Scoring weights must sum to 100 (got ${weightSum})`;
  if (!form.voiceAccent) {
    return 'Select accent, gender, and language for the AI agent';
  }
  if (!isInterviewLanguage(form.interviewLanguage)) {
    return 'Interview language must be English or Hindi';
  }
  if (!form.voiceId) {
    return 'Select an AI agent from the matching list';
  }
  if (isHindiLanguage(form.interviewLanguage) && String(form.voiceAccent).toLowerCase() !== 'indian') {
    return 'Hindi interviews need an Indian-accent voice';
  }
  if (!form.voiceGender || !form.interviewLanguage || !form.voiceStyle || !form.voiceName) {
    return 'Complete the AI agent details';
  }
  return null;
}

export function validateRequirements(form) {
  return validateAiSetup(form);
}

export function isJobFormDirty(form, baseline = emptyJobForm) {
  const current = formToPayload(form);
  const initial = formToPayload(baseline);
  return JSON.stringify(current) !== JSON.stringify(initial);
}
