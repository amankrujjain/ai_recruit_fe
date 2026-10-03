import { describe, it, expect } from 'vitest';
import {
  accentsForInterviewLanguage,
  distinctVoiceOptions,
  filterVoices,
  isInterviewLanguage,
  isVoiceEligibleForLanguage,
  listVoicesForCriteria,
  pickVoiceForCriteria,
  resolveVoicePreviewUrl,
  voiceToAgentFields,
} from '@/lib/voiceAgent';

const dan = {
  voiceId: 'dan',
  name: 'Dan',
  gender: 'male',
  language: 'en',
  accent: 'american',
  descriptive: 'deep',
  previewUrl: 'https://example.com/dan.mp3',
  supportedLanguages: ['en', 'hi'],
};

const anika = {
  voiceId: 'anika',
  name: 'Anika',
  gender: 'female',
  language: 'en',
  accent: 'indian',
  descriptive: 'upbeat',
  previewUrl: 'https://example.com/anika-en.mp3',
  supportedLanguages: ['en', 'hi'],
  languagePreviews: {
    en: 'https://example.com/anika-en.mp3',
    hi: 'https://example.com/anika-hi.mp3',
  },
};

const priya = {
  voiceId: 'priya',
  name: 'Priya',
  gender: 'female',
  language: 'en',
  accent: 'indian',
  descriptive: 'professional',
  previewUrl: 'https://example.com/priya.mp3',
  supportedLanguages: ['en'],
};

const agastya = {
  voiceId: 'agastya',
  name: 'Agastya',
  gender: 'male',
  language: 'hi',
  accent: 'indian',
  descriptive: 'intense',
  supportedLanguages: ['hi'],
};

describe('interview language allow-list', () => {
  it('only treats English and Hindi as interview languages', () => {
    expect(isInterviewLanguage('en')).toBe(true);
    expect(isInterviewLanguage('hi')).toBe(true);
    expect(isInterviewLanguage('bn')).toBe(false);
    expect(distinctVoiceOptions([dan, anika, { ...dan, language: 'bn' }]).languages)
      .toEqual(['en', 'hi']);
  });

  it('limits Hindi accents to indian and English accents to allow-list', () => {
    expect(accentsForInterviewLanguage([dan, anika, priya, agastya], 'hi')).toEqual(['indian']);
    expect(accentsForInterviewLanguage([dan, anika, priya], 'en')).toEqual([
      'american',
      'indian',
    ]);
  });
});

describe('voiceAgent Hindi filter', () => {
  it('rejects american + Hindi-compat voices for hi', () => {
    expect(isVoiceEligibleForLanguage(dan, 'hi')).toBe(false);
    expect(isVoiceEligibleForLanguage(anika, 'hi')).toBe(true);
    expect(filterVoices([dan, anika], { language: 'hi' }).map((voice) => voice.voiceId))
      .toEqual(['anika']);
  });

  it('allows native Hindi voices and lists them for male + hi + indian', () => {
    expect(isVoiceEligibleForLanguage(agastya, 'hi')).toBe(true);
    expect(listVoicesForCriteria([dan, agastya], {
      gender: 'male',
      language: 'hi',
      accent: 'indian',
    }).map((voice) => voice.voiceId)).toEqual(['agastya']);
  });

  it('excludes native Hindi voices from English interview lists', () => {
    expect(filterVoices([agastya, dan], { language: 'en' }).map((voice) => voice.voiceId))
      .toEqual(['dan']);
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

describe('listVoicesForCriteria', () => {
  it('lists Indian female matches for Hindi without requiring professional tone', () => {
    const list = listVoicesForCriteria([dan, priya, anika], {
      gender: 'female',
      language: 'hi',
      accent: 'indian',
    });
    expect(list.map((voice) => voice.voiceId)).toEqual(['anika']);
  });

  it('lists up to 10 English Indian matches including non-professional tones', () => {
    const list = listVoicesForCriteria([dan, priya, anika], {
      gender: 'female',
      language: 'en',
      accent: 'indian',
    });
    expect(list.map((voice) => voice.voiceId)).toEqual(['anika', 'priya']);
  });

  it('caps results at the limit', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({
      ...anika,
      voiceId: `v${index}`,
      name: `Voice ${index}`,
    }));
    expect(listVoicesForCriteria(many, {
      gender: 'female',
      language: 'hi',
      accent: 'indian',
      limit: 10,
    })).toHaveLength(10);
  });
});

describe('pickVoiceForCriteria', () => {
  it('can still filter by optional style when provided', () => {
    const voice = pickVoiceForCriteria([dan, priya, anika], {
      gender: 'female',
      language: 'en',
      accent: 'indian',
      style: 'professional',
    });
    expect(voice?.voiceId).toBe('priya');
  });

  it('returns first alphabetical match when style is omitted', () => {
    const voice = pickVoiceForCriteria([priya, anika], {
      gender: 'female',
      language: 'en',
      accent: 'indian',
    });
    expect(voice?.voiceId).toBe('anika');
  });
});

describe('resolveVoicePreviewUrl', () => {
  it('prefers language-specific preview for Hindi', () => {
    expect(resolveVoicePreviewUrl(anika, 'hi')).toBe('https://example.com/anika-hi.mp3');
    expect(resolveVoicePreviewUrl(anika, 'en')).toBe('https://example.com/anika-en.mp3');
    expect(resolveVoicePreviewUrl(priya, 'hi')).toBe('https://example.com/priya.mp3');
  });
});
