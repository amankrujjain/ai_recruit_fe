import { describe, it, expect } from 'vitest';
import {
  DEFAULT_AGENT_TONE,
  distinctVoiceOptions,
  filterVoices,
  isVoiceEligibleForLanguage,
  pickVoiceForCriteria,
  voiceToAgentFields,
} from '@/lib/voiceAgent';

const dan = {
  voiceId: 'dan',
  name: 'Dan',
  gender: 'male',
  language: 'en',
  accent: 'american',
  descriptive: 'deep',
  supportedLanguages: ['en', 'hi'],
};

const anika = {
  voiceId: 'anika',
  name: 'Anika',
  gender: 'female',
  language: 'hi',
  accent: 'indian',
  descriptive: 'warm',
  supportedLanguages: ['hi', 'en'],
};

const priya = {
  voiceId: 'priya',
  name: 'Priya',
  gender: 'female',
  language: 'en',
  accent: 'indian',
  descriptive: 'professional',
  supportedLanguages: ['en'],
};

describe('voiceAgent Hindi filter', () => {
  it('rejects american + Hindi-compat voices for hi', () => {
    expect(isVoiceEligibleForLanguage(dan, 'hi')).toBe(false);
    expect(isVoiceEligibleForLanguage(anika, 'hi')).toBe(true);
    expect(filterVoices([dan, anika], { language: 'hi' }).map((voice) => voice.voiceId))
      .toEqual(['anika']);
  });
});

describe('voiceToAgentFields', () => {
  it('clears only resolved agent fields when voice is missing', () => {
    expect(voiceToAgentFields(null)).toEqual({
      voiceId: '',
      voiceName: '',
      agentSnapshot: {},
    });
  });
});

describe('distinctVoiceOptions genders', () => {
  it('includes only male and female', () => {
    const options = distinctVoiceOptions([
      dan,
      { ...priya, gender: 'neutral' },
      priya,
    ]);
    expect(options.genders).toEqual(['female', 'male']);
  });
});

describe('pickVoiceForCriteria', () => {
  it('picks professional voice for gender, language, and accent', () => {
    const voice = pickVoiceForCriteria([dan, priya, anika], {
      gender: 'female',
      language: 'en',
      accent: 'indian',
      style: DEFAULT_AGENT_TONE,
    });
    expect(voice?.voiceId).toBe('priya');
  });

  it('returns null when no professional match exists', () => {
    const voice = pickVoiceForCriteria([anika], {
      gender: 'female',
      language: 'hi',
      accent: 'indian',
      style: DEFAULT_AGENT_TONE,
    });
    expect(voice).toBeNull();
  });
});
