import { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExternalLink, FileAudio, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDecisionRequest,
  getCallRecordsRequest,
  getScorecardRequest,
} from '@/api/recruitmentApi';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  recommendationDescriptions,
  recommendationLabels,
  recommendationVariants,
} from '@/lib/recommendation';
const SCORE_DIMENSIONS = [
  { key: 'technicalAlignment', label: 'Technical' },
  { key: 'communicationScore', label: 'Communication' },
  { key: 'confidenceScore', label: 'Confidence' },
  { key: 'roleAlignment', label: 'Role alignment' },
  { key: 'interestLevel', label: 'Interest' },
];

function formatScore(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return '—';
  return `${Math.round(n)}`;
}

function formatDateTime(value, timeZone) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  });
}

function formatDuration(seconds) {
  if (seconds == null) return '—';
  const s = Number(seconds);
  if (Number.isNaN(s) || s < 0) return '—';
  const mins = Math.floor(s / 60);
  const secs = Math.round(s % 60);
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

function buildTimeline(callRecords) {
  const events = [];
  for (const record of callRecords || []) {
    const schedule = record.callSchedule;
    const tz = schedule?.timezone;

    if (schedule?.createdAt) {
      events.push({
        id: `${record.callRecordId}-scheduled`,
        label: 'Call scheduled',
        at: schedule.createdAt,
        detail: formatDateTime(schedule.scheduledAt, tz),
      });
    }

    if (record.createdAt) {
      events.push({
        id: `${record.callRecordId}-dialed`,
        label: 'Interview captured',
        at: record.createdAt,
        detail: record.outcome || record.completionStatus || 'Recorded',
      });
    }

    const terminal = schedule?.status || record.outcome || record.completionStatus;
    if (terminal) {
      events.push({
        id: `${record.callRecordId}-status`,
        label: String(terminal).replace(/_/g, ' '),
        at: record.updatedAt || record.createdAt,
        detail: `Duration ${formatDuration(record.durationSeconds)}`,
      });
    }

    if (record.evaluation?.createdAt) {
      events.push({
        id: `${record.callRecordId}-scored`,
        label: 'Scorecard generated',
        at: record.evaluation.createdAt,
        detail: record.evaluation.recommendation
          ? recommendationLabels[record.evaluation.recommendation]
            || record.evaluation.recommendation
          : 'Evaluated',
      });
    }
  }

  return events.sort((a, b) => new Date(a.at) - new Date(b.at));
}

function ScoreBar({ label, value }) {
  const n = Number(value);
  const pct = Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, n));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium text-foreground">{formatScore(value)}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Recruiter drawer: interview scores, strengths/concerns, fit verdict, transcript, timeline.
 */
export function InterviewScorecardDrawer({
  open,
  candidateJobId,
  candidateName,
  onOpenChange,
}) {
  const titleId = useId();
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState(null);
  const [callRecords, setCallRecords] = useState([]);
  const [decisionLoading, setDecisionLoading] = useState(false);

  const close = () => onOpenChange?.(false);

  const saveDecision = async (decision) => {
    setDecisionLoading(true);
    try {
      await createDecisionRequest(candidateJobId, { decision });
      toast.success(decision === 'REJECTED' ? 'Candidate rejected' : 'Candidate marked selected');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save decision');
    } finally {
      setDecisionLoading(false);
    }
  };

  useEffect(() => {
    if (!open || !candidateJobId) return undefined;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [scoreRes, callsRes] = await Promise.all([
          getScorecardRequest(candidateJobId),
          getCallRecordsRequest(candidateJobId),
        ]);
        if (cancelled) return;
        setScorecard(scoreRes.data?.data ?? null);
        setCallRecords(callsRes.data?.data ?? []);
      } catch (err) {
        if (!cancelled) {
          toast.error(err.response?.data?.message || 'Failed to load interview scorecard');
          setScorecard(null);
          setCallRecords([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [open, candidateJobId]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onOpenChange?.(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === 'undefined') return null;

  const callRecord = scorecard?.callRecord
    || callRecords[0]
    || null;
  const evaluation = callRecord?.evaluation || null;
  const summary = scorecard?.summary || {};
  const recommendation = evaluation?.recommendation || summary.aiRecommendation || null;
  const strengths = toList(evaluation?.strengths || summary.strengths);
  const concerns = toList(evaluation?.concerns || summary.concerns);
  const callSummary = evaluation?.rawAiResponse?.callSummary
    || summary.callSummary
    || callRecord?.summary
    || null;
  const transcript = callRecord?.transcriptText || null;
  const recordingUrl = callRecord?.recordingUrl || null;
  const matchScore = summary.matchScore ?? null;
  const timeline = buildTimeline(callRecords.length ? callRecords : (callRecord ? [callRecord] : []));

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        aria-label="Close scorecard overlay"
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
        onClick={close}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-xl flex-col border-l border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              Interview scorecard
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {candidateName || 'Candidate'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-brand-50 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {loading && (
            <p className="text-sm text-muted">Loading interview results…</p>
          )}

          {!loading && !callRecord && !scorecard && (
            <p className="text-sm text-muted">
              No interview results yet for this candidate.
            </p>
          )}

          {!loading && (callRecord || scorecard) && (
            <>
              {/* Fit verdict */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Fit recommendation</h3>
                {recommendation ? (
                  <div className="rounded-xl border border-border bg-brand-50/40 p-4">
                    <Badge variant={recommendationVariants[recommendation] || 'muted'}>
                      {recommendationLabels[recommendation] || recommendation}
                    </Badge>
                    <p className="mt-2 text-sm text-muted">
                      {recommendationDescriptions[recommendation]
                        || 'AI recommendation based on the screening call.'}
                    </p>
                    {matchScore != null && (
                      <p className="mt-2 text-xs text-muted">
                        Resume match score: <span className="font-medium text-foreground">{formatScore(matchScore)}%</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted">Scorecard not generated yet.</p>
                )}
              </section>

              {/* Dimension scores */}
              {evaluation && (
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Scores</h3>
                  <div className="space-y-3 rounded-xl border border-border p-4">
                    {SCORE_DIMENSIONS.map(({ key, label }) => (
                      <ScoreBar key={key} label={label} value={evaluation[key]} />
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-muted">
                    <p>
                      Duration:{' '}
                      <span className="font-medium text-foreground">
                        {formatDuration(callRecord?.durationSeconds)}
                      </span>
                    </p>
                    <p>
                      Notice:{' '}
                      <span className="font-medium text-foreground">
                        {evaluation.noticePeriod || '—'}
                      </span>
                    </p>
                    <p className="col-span-2">
                      Salary expectations:{' '}
                      <span className="font-medium text-foreground">
                        {evaluation.salaryExpectations || '—'}
                      </span>
                    </p>
                  </div>
                </section>
              )}

              {/* Summary */}
              {callSummary && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Call summary</h3>
                  <p className="rounded-xl border border-border p-4 text-sm leading-relaxed text-foreground">
                    {callSummary}
                  </p>
                </section>
              )}

              {/* Strengths / concerns */}
              <section className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-emerald-700">What went right</h3>
                  {strengths.length ? (
                    <ul className="space-y-1.5 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3 text-sm text-foreground">
                      {strengths.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-emerald-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No strengths listed.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-amber-700">What could be better</h3>
                  {concerns.length ? (
                    <ul className="space-y-1.5 rounded-xl border border-amber-100 bg-amber-50/50 p-3 text-sm text-foreground">
                      {concerns.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="text-amber-600">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted">No concerns listed.</p>
                  )}
                </div>
              </section>

              {/* Recording */}
              {recordingUrl && (
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Recording</h3>
                  <a
                    href={recordingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
                  >
                    <FileAudio className="h-4 w-4" />
                    Open recording
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </section>
              )}

              {/* Transcript */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Transcript</h3>
                {transcript ? (
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border bg-slate-50 p-4 text-xs leading-relaxed text-foreground">
                    {transcript}
                  </pre>
                ) : (
                  <p className="text-sm text-muted">Transcript not available yet.</p>
                )}
              </section>

              {/* Audit timeline */}
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Interview audit</h3>
                {timeline.length ? (
                  <ol className="space-y-3 border-l border-border pl-4">
                    {timeline.map((event) => (
                      <li key={event.id} className="relative">
                        <span className="absolute -left-[1.35rem] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600" />
                        <p className="text-sm font-medium text-foreground">{event.label}</p>
                        <p className="text-xs text-muted">
                          {formatDateTime(event.at)}
                          {event.detail ? ` · ${event.detail}` : ''}
                        </p>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted">No audit events yet.</p>
                )}
              </section>
            </>
          )}
        </div>

        <footer className="border-t border-border px-5 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                disabled={decisionLoading}
                onClick={() => saveDecision('SELECTED')}
              >
                Mark selected
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={decisionLoading}
                onClick={() => saveDecision('REJECTED')}
              >
                Reject
              </Button>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        </footer>
      </aside>
    </div>,
    document.body
  );
}
