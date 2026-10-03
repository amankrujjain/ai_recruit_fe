export const DEFAULT_AGENT_TONE = 'professional';
export const AGENT_LIST_LIMIT = 10;

/** Interviews only support English and Hindi. */
export const INTERVIEW_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
];

export const ALLOWED_INTERVIEW_ACCENTS = ['american', 'british', 'indian'];

const ALLOWED_AGENT_GENDERS = new Set(['male', 'female']);
const ALLOWED_ACCENT_SET = new Set(ALLOWED_INTERVIEW_ACCENTS);

export function isAllowedAgentGender(gender) {
  return ALLOWED_AGENT_GENDERS.has(String(gender || '').trim().toLowerCase());
}

export const HINDI_INDIAN_ACCENT_HELP =
  'Hindi interviews use an Indian / native Hindi voice. American or British accents are not allowed for Hindi.';

export function isHindiLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  return value === 'hi' || value === 'hindi';
}

export function isEnglishLanguage(language) {
  const value = String(language || '').trim().toLowerCase();
  return value === 'en' || value === 'english';
}

export function isInterviewLanguage(language) {
  return isEnglishLanguage(language) || isHindiLanguage(language);
}

export function normalizeInterviewLanguage(language) {
  if (isHindiLanguage(language)) return 'hi';
  if (isEnglishLanguage(language)) return 'en';
  return '';
}

export function isVoiceEligibleForLanguage(voice, language) {
  if (!voice) return false;
  if (!isHindiLanguage(language)) return true;
  // Native Hindi voices (shared library language=hi) are eligible.
  if (isHindiLanguage(voice.language)) return true;
  const accent = String(voice.accent || '').trim().toLowerCase();
  const supported = Array.isArray(voice.supportedLanguages)
    ? voice.supportedLanguages.map((item) => String(item).toLowerCase())
    : [];
  // Multilingual English voices: only Indian accent + verified Hindi.
  return accent === 'indian' && supported.includes('hi');
}

export function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean).map((item) => String(item)))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function isAllowedInterviewAccent(accent) {
  return ALLOWED_ACCENT_SET.has(String(accent || '').trim().toLowerCase());
}

/** Accents offered for the selected interview language. */
export function accentsForInterviewLanguage(voices = [], language) {
  if (isHindiLanguage(language)) return ['indian'];
  if (!isEnglishLanguage(language)) return [];

  const fromCatalog = uniqueSorted(
    (voices || [])
      .filter((voice) => {
        if (isHindiLanguage(voice.language)) return false;
        if (voice.language === 'en') return true;
        const supported = Array.isArray(voice.supportedLanguages) ? voice.supportedLanguages : [];
        return supported.includes('en');
      })
      .map((voice) => voice.accent)
      .filter(isAllowedInterviewAccent)
  );

  return fromCatalog.length ? fromCatalog : [...ALLOWED_INTERVIEW_ACCENTS];
}

export function distinctVoiceOptions(voices = []) {
  return {
    genders: uniqueSorted(voices.map((voice) => voice.gender).filter(isAllowedAgentGender)),
    languages: INTERVIEW_LANGUAGES.map((item) => item.value),
    accents: uniqueSorted(
      voices.map((voice) => voice.accent).filter(isAllowedInterviewAccent)
    ),
    tones: uniqueSorted(voices.map((voice) => voice.descriptive)),
  };
}

export function filterVoices(voices = [], { gender, language, accent, style } = {}) {
  const interviewLanguage = normalizeInterviewLanguage(language);
  return voices.filter((voice) => {
    if (gender && voice.gender !== gender) return false;
    if (accent && voice.accent !== accent) return false;
    if (
      style
      && String(voice.descriptive || '').toLowerCase() !== String(style).toLowerCase()
    ) {
      return false;
    }
    if (!interviewLanguage) return true;

    if (isHindiLanguage(interviewLanguage)) {
      return isVoiceEligibleForLanguage(voice, interviewLanguage);
    }

    // English interviews: exclude native Hindi primary voices.
    if (isHindiLanguage(voice.language)) return false;
    if (voice.language === 'en') return true;
    const supported = Array.isArray(voice.supportedLanguages) ? voice.supportedLanguages : [];
    return supported.includes('en');
  });
}

/** Filtered agent choices for the recruiter picker (no forced tone). */
export function listVoicesForCriteria(
  voices = [],
  { gender, language, accent, limit = AGENT_LIST_LIMIT } = {}
) {
  if (!gender || !language || !accent) return [];
  if (!isInterviewLanguage(language)) return [];
  const matches = filterVoices(voices, { gender, language, accent });
  return [...matches]
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .slice(0, Math.max(0, Number(limit) || AGENT_LIST_LIMIT));
}

export function pickVoiceForCriteria(
  voices = [],
  { gender, language, accent, style } = {}
) {
  if (!gender || !language || !accent) return null;
  if (!isInterviewLanguage(language)) return null;
  const matches = filterVoices(voices, { gender, language, accent, style });
  if (!matches.length) return null;
  return [...matches].sort((a, b) => String(a.name).localeCompare(String(b.name)))[0];
}

/** Prefer language-specific ElevenLabs preview when available. */
export function resolveVoicePreviewUrl(voice, language) {
  if (!voice) return null;
  const lang = normalizeInterviewLanguage(language) || String(language || '').trim().toLowerCase();
  const byLang = voice.languagePreviews && typeof voice.languagePreviews === 'object'
    ? voice.languagePreviews
    : null;
  if (lang && byLang?.[lang]) return byLang[lang];
  if (isHindiLanguage(lang) && byLang?.hi) return byLang.hi;
  return voice.previewUrl || null;
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
    interviewLanguage: normalizeInterviewLanguage(voice.language) || voice.language || '',
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
