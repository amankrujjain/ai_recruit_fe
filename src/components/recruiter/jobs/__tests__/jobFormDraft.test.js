import { describe, it, expect } from 'vitest';
import { AiRoundType } from '@/lib/aiRoundType';
import {
  emptyJobForm,
  formToPayload,
  validateAiSetup,
  validateRoleDetails,
} from '@/components/recruiter/jobs/jobFormDraft';

const validDetails = {
  ...emptyJobForm,
  jobTitle: 'Engineer',
  location: ['Remote'],
  jobDescription: 'Build APIs long enough',
  mandatorySkills: ['React'],
};

const validAgent = {
  voiceId: 'anika',
  voiceName: 'Anika',
  voiceGender: 'female',
  interviewLanguage: 'hi',
  voiceAccent: 'indian',
  voiceStyle: 'professional',
};

describe('jobFormDraft', () => {
  it('requires JD and a mandatory skill on step 1', () => {
    expect(validateRoleDetails({ ...emptyJobForm, jobTitle: 'Eng', location: ['Remote'] }))
      .toMatch(/description/i);
    expect(validateRoleDetails({
      ...emptyJobForm,
      jobTitle: 'Eng',
      location: ['Remote'],
      jobDescription: 'Long enough text',
    })).toMatch(/mandatory/i);
    expect(validateRoleDetails(validDetails)).toBeNull();
  });

  it('validates rounds and Hindi accent, and payload uses rounds not HUMAN', () => {
    expect(validateAiSetup({ ...validDetails, ...validAgent, rounds: [] })).toMatch(/round/i);
    expect(validateAiSetup({
      ...validDetails,
      ...validAgent,
      interviewLanguage: 'hi',
      voiceAccent: 'american',
    })).toMatch(/Indian-accent/i);

    const payload = formToPayload({ ...validDetails, ...validAgent });
    expect(payload.rounds).toHaveLength(2);
    expect(payload.rounds.map((round) => round.roundType)).toEqual([
      AiRoundType.AI_CALL,
      AiRoundType.AI_SCREENING,
    ]);
    expect(payload).not.toHaveProperty('aiRounds');
    expect(payload).not.toHaveProperty('status');
    expect(payload.rounds.some((round) => round.roundType === 'HUMAN')).toBe(false);
  });
});
