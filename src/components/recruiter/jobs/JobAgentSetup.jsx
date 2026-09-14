import { useEffect, useMemo, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import {
  DEFAULT_AGENT_TONE,
  distinctVoiceOptions,
  HINDI_INDIAN_ACCENT_HELP,
  isHindiLanguage,
  isAllowedAgentGender,
  isVoiceEligibleForLanguage,
  pickVoiceForCriteria,
  voiceToAgentFields,
} from '@/lib/voiceAgent';

const recruiterAgentVoices = (voices) =>
  (voices || []).filter((voice) => !voice.gender || isAllowedAgentGender(voice.gender));

export function JobAgentSetup({ form, setForm, voices, voicesLoading }) {
  const audioRef = useRef(null);
  const catalogVoices = useMemo(() => recruiterAgentVoices(voices), [voices]);
  const options = useMemo(() => distinctVoiceOptions(catalogVoices), [catalogVoices]);

  const selected = catalogVoices.find((voice) => voice.voiceId === form.voiceId) || null;
  const showHindiHelp = isHindiLanguage(form.interviewLanguage)
    && (!selected || !isVoiceEligibleForLanguage(selected, form.interviewLanguage));

  const criteriaReady = Boolean(
    form.voiceGender && form.interviewLanguage && form.voiceAccent
  );

  const onCriteriaChange = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    if (!catalogVoices.length) return;

    if (!criteriaReady) {
      setForm((current) => {
        if (!current.voiceId) return current;
        return {
          ...current,
          ...voiceToAgentFields(null),
          voiceStyle: DEFAULT_AGENT_TONE,
        };
      });
      return;
    }

    const voice = pickVoiceForCriteria(catalogVoices, {
      gender: form.voiceGender,
      language: form.interviewLanguage,
      accent: form.voiceAccent,
      style: DEFAULT_AGENT_TONE,
    });

    const nextId = voice?.voiceId || '';
    setForm((current) => {
      if (current.voiceId === nextId && current.voiceStyle === DEFAULT_AGENT_TONE) {
        if (!voice && !current.voiceId) return current;
        if (voice && current.voiceName === voice.name) return current;
      }
      return {
        ...current,
        ...voiceToAgentFields(voice),
        voiceStyle: DEFAULT_AGENT_TONE,
      };
    });
  }, [
    catalogVoices,
    form.voiceGender,
    form.interviewLanguage,
    form.voiceAccent,
    criteriaReady,
    setForm,
  ]);

  const playPreview = () => {
    const url = selected?.previewUrl;
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
          Choose gender, language, and accent. We pick a professional-tone agent automatically.
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
            {options.genders.map((gender) => (
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
            {options.languages.map((language) => (
              <option key={language} value={language}>{language}</option>
            ))}
            {!options.languages.includes('hi') ? <option value="hi">hi</option> : null}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="voiceAccent">Accent</Label>
          <Select
            id="voiceAccent"
            aria-label="Accent"
            value={form.voiceAccent}
            onChange={(event) => onCriteriaChange('voiceAccent', event.target.value)}
          >
            <option value="">Select accent</option>
            {options.accents.map((accent) => (
              <option key={accent} value={accent}>{accent}</option>
            ))}
          </Select>
        </div>

        {criteriaReady ? (
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs font-medium text-muted">Selected agent</p>
            <p className="text-sm text-foreground">
              {form.voiceName || 'No matching agent — try different options'}
              {form.voiceName ? ` · ${DEFAULT_AGENT_TONE} tone` : null}
            </p>
          </div>
        ) : null}
      </div>

      {showHindiHelp ? (
        <p className="text-xs text-amber-700">{HINDI_INDIAN_ACCENT_HELP}</p>
      ) : null}

      <Button type="button" variant="outline" size="sm" onClick={playPreview} disabled={!selected}>
        <Volume2 className="mr-1 h-4 w-4" aria-hidden />
        Listen
      </Button>
    </div>
  );
}
