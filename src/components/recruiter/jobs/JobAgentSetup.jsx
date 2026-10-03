import { useEffect, useMemo, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
  AGENT_LIST_LIMIT,
  INTERVIEW_LANGUAGES,
  accentsForInterviewLanguage,
  HINDI_INDIAN_ACCENT_HELP,
  isHindiLanguage,
  isAllowedAgentGender,
  listVoicesForCriteria,
  resolveVoicePreviewUrl,
  voiceToAgentFields,
} from '@/lib/voiceAgent';

const recruiterAgentVoices = (voices) =>
  (voices || []).filter((voice) => !voice.gender || isAllowedAgentGender(voice.gender));

export function JobAgentSetup({ form, setForm, voices, voicesLoading }) {
  const audioRef = useRef(null);
  const catalogVoices = useMemo(() => recruiterAgentVoices(voices), [voices]);
  const genders = useMemo(
    () => [...new Set(catalogVoices.map((voice) => voice.gender).filter(isAllowedAgentGender))].sort(),
    [catalogVoices]
  );
  const accents = useMemo(
    () => accentsForInterviewLanguage(catalogVoices, form.interviewLanguage),
    [catalogVoices, form.interviewLanguage]
  );

  const criteriaReady = Boolean(
    form.voiceGender && form.interviewLanguage && form.voiceAccent
  );

  const matches = useMemo(() => {
    if (!criteriaReady) return [];
    return listVoicesForCriteria(catalogVoices, {
      gender: form.voiceGender,
      language: form.interviewLanguage,
      accent: form.voiceAccent,
      limit: AGENT_LIST_LIMIT,
    });
  }, [
    catalogVoices,
    criteriaReady,
    form.voiceGender,
    form.interviewLanguage,
    form.voiceAccent,
  ]);

  const selected = matches.find((voice) => voice.voiceId === form.voiceId)
    || catalogVoices.find((voice) => voice.voiceId === form.voiceId)
    || null;

  const showHindiHelp = isHindiLanguage(form.interviewLanguage)
    && form.voiceAccent
    && form.voiceAccent !== 'indian';

  const onCriteriaChange = (key, value) => {
    setForm((current) => {
      let nextAccent = key === 'voiceAccent' ? value : current.voiceAccent;
      let nextLanguage = key === 'interviewLanguage' ? value : current.interviewLanguage;
      let nextGender = key === 'voiceGender' ? value : current.voiceGender;

      if (key === 'interviewLanguage' && isHindiLanguage(value)) {
        nextAccent = 'indian';
      } else if (key === 'interviewLanguage' && !isHindiLanguage(value)) {
        // Leaving Hindi: clear accent so recruiter picks an English accent.
        nextAccent = '';
      }

      return {
        ...current,
        voiceGender: nextGender,
        interviewLanguage: nextLanguage,
        voiceAccent: nextAccent,
        ...voiceToAgentFields(null),
        // Preserve the criteria we just set (voiceToAgentFields clears agent ids only).
        voiceGender: nextGender,
        interviewLanguage: nextLanguage,
        voiceAccent: nextAccent,
        voiceStyle: '',
      };
    });
  };

  const selectVoice = (voice) => {
    if (!voice) return;
    setForm((current) => ({
      ...current,
      ...voiceToAgentFields(voice),
      // Keep recruiter-chosen interview language (e.g. hi on an en-labeled multilingual voice).
      interviewLanguage: current.interviewLanguage || voice.language || '',
      voiceGender: current.voiceGender || voice.gender || '',
      voiceAccent: current.voiceAccent || voice.accent || '',
      voiceStyle: voice.descriptive || '',
    }));
  };

  // Drop selection when filters change and the chosen agent is no longer in the match list.
  useEffect(() => {
    if (!form.voiceId) return;
    if (!criteriaReady) {
      setForm((current) => {
        if (!current.voiceId) return current;
        return {
          ...current,
          ...voiceToAgentFields(null),
          voiceStyle: '',
        };
      });
      return;
    }
    const stillValid = matches.some((voice) => voice.voiceId === form.voiceId);
    if (stillValid) return;
    setForm((current) => {
      if (!current.voiceId) return current;
      return {
        ...current,
        ...voiceToAgentFields(null),
        voiceStyle: '',
      };
    });
  }, [criteriaReady, form.voiceId, matches, setForm]);

  const playPreview = (voice) => {
    const url = resolveVoicePreviewUrl(voice, form.interviewLanguage);
    if (!url) {
      toast.error('No preview available for this voice');
      return;
    }
    audioRef.current?.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play().catch(() => {
      toast.error('Unable to play voice preview');
    });
  };

  useEffect(() => () => audioRef.current?.pause(), []);

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">AI agent</h3>
        <p className="mt-0.5 text-xs text-muted">
          Filter by gender, language, and accent, then pick an agent from the list (up to {AGENT_LIST_LIMIT}).
        </p>
      </div>

      {voicesLoading ? (
        <p className="text-sm text-muted">Loading voices…</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="voiceGender">Gender</Label>
          <Select
            id="voiceGender"
            aria-label="Gender"
            value={form.voiceGender}
            onChange={(event) => onCriteriaChange('voiceGender', event.target.value)}
          >
            <option value="">Select gender</option>
            {genders.map((gender) => (
              <option key={gender} value={gender}>{gender}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interviewLanguage">Language</Label>
          <Select
            id="interviewLanguage"
            aria-label="Language"
            value={form.interviewLanguage}
            onChange={(event) => onCriteriaChange('interviewLanguage', event.target.value)}
          >
            <option value="">Select language</option>
            {INTERVIEW_LANGUAGES.map((language) => (
              <option key={language.value} value={language.value}>{language.label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="voiceAccent">Accent</Label>
          <Select
            id="voiceAccent"
            aria-label="Accent"
            value={form.voiceAccent}
            onChange={(event) => onCriteriaChange('voiceAccent', event.target.value)}
            disabled={isHindiLanguage(form.interviewLanguage)}
          >
            <option value="">Select accent</option>
            {accents.map((accent) => (
              <option key={accent} value={accent}>{accent}</option>
            ))}
          </Select>
        </div>
      </div>

      {showHindiHelp ? (
        <p className="text-xs text-amber-700">{HINDI_INDIAN_ACCENT_HELP}</p>
      ) : null}

      {criteriaReady ? (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted">
            {matches.length
              ? `Matching agents (${matches.length}${matches.length >= AGENT_LIST_LIMIT ? '+' : ''})`
              : 'No matching agents'}
          </p>
          {matches.length ? (
            <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {matches.map((voice) => {
                const isSelected = form.voiceId === voice.voiceId;
                return (
                  <li
                    key={voice.voiceId}
                    className={`flex items-center gap-3 px-3 py-2.5 ${
                      isSelected ? 'bg-brand-50' : 'bg-white'
                    }`}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => selectVoice(voice)}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-sm font-medium text-foreground">
                        {voice.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {[voice.gender, voice.accent, voice.descriptive]
                          .filter(Boolean)
                          .join(' · ')}
                      </span>
                    </button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => playPreview(voice)}
                      disabled={!resolveVoicePreviewUrl(voice, form.interviewLanguage)}
                    >
                      <Volume2 className="mr-1 h-4 w-4" aria-hidden />
                      Listen
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Try a different gender, language, or accent combination.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
