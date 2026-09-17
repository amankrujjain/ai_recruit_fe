export const DEFAULT_AGENT_TONE = 'professional';

const ALLOWED_AGENT_GENDERS = new Set(['male', 'female']);

export function isAllowedAgentGender(gender) {
  return ALLOWED_AGENT_GENDERS.has(String(gender || '').trim().toLowerCase());
}

export const HINDI_INDIAN_ACCENT_HELP =
  'Hindi interviews need an Indian-accent voice. Compatibility Hindi on an American-accent voice is not allowed.';

export function isHindiLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  return value === 'hi' || value === 'hindi';
}

export function isVoiceEligibleForLanguage(voice, language) {
  if (!voice) return false;
  if (!isHindiLanguage(language)) return true;
  const accent = String(voice.accent || '').trim().toLowerCase();
  const supported = Array.isArray(voice.supportedLanguages)
    ? voice.supportedLanguages.map((item) => String(item).toLowerCase())
    : [];
  return accent === 'indian' && supported.includes('hi');
}

export function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean).map((item) => String(item)))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function distinctVoiceOptions(voices = []) {
  return {
    genders: uniqueSorted(voices.map((voice) => voice.gender).filter(isAllowedAgentGender)),
    languages: uniqueSorted(voices.map((voice) => voice.language)),
    accents: uniqueSorted(voices.map((voice) => voice.accent)),
    tones: uniqueSorted(voices.map((voice) => voice.descriptive)),
  };
}

export function filterVoices(voices = [], { gender, language, accent, style } = {}) {
  return voices.filter((voice) => {
    if (gender && voice.gender !== gender) return false;
    if (accent && voice.accent !== accent) return false;
    if (
      style
      && String(voice.descriptive || '').toLowerCase() !== String(style).toLowerCase()
    ) {
      return false;
    }
    if (!language) return true;
    if (isHindiLanguage(language)) return isVoiceEligibleForLanguage(voice, language);
    if (voice.language === language) return true;
    const supported = Array.isArray(voice.supportedLanguages) ? voice.supportedLanguages : [];
    return supported.includes(language);
  });
}

export function pickVoiceForCriteria(
  voices = [],
  { gender, language, accent, style = DEFAULT_AGENT_TONE } = {}
) {
  if (!gender || !language || !accent) return null;
  const matches = filterVoices(voices, { gender, language, accent, style });
  if (!matches.length) return null;
  return [...matches].sort((a, b) => String(a.name).localeCompare(String(b.name)))[0];
}

export function voiceToAgentFields(voice) {
  if (!voice) {
    return {
      voiceId: '',
      voiceName: '',
      agentSnapshot: {},
    };
  }
  return {
    voiceId: voice.voiceId,
    voiceName: voice.name,
    voiceGender: voice.gender || '',
    interviewLanguage: voice.language || '',
    voiceAccent: voice.accent || '',
    voiceStyle: voice.descriptive || '',
    agentSnapshot: {
      voiceId: voice.voiceId,
      name: voice.name,
      gender: voice.gender || null,
      language: voice.language || null,
      accent: voice.accent || null,
      descriptive: voice.descriptive || null,
      supportedLanguages: Array.isArray(voice.supportedLanguages) ? voice.supportedLanguages : [],
    },
  };
}
