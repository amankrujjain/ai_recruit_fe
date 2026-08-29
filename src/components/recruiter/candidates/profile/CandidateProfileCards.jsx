import { Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import {
  formatOutreachLabel,
  getOutreachDisplayStatus,
  OutreachDisplayStatus,
} from '@/lib/candidateEligibility';
import { cn } from '@/lib/utils';

function ScoreBar({ label, value, max = 100 }) {
  if (value == null || value === '') {
    return (
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="text-muted">—</span>
      </div>
    );
  }
  const n = Number(value);
  const pct = Number.isNaN(n) ? 0 : Math.max(0, Math.min(100, (n / max) * 100));
  const band = max === 10
    ? (n >= 8 ? 'high' : n >= 6.5 ? 'mid' : 'low')
    : (n >= 80 ? 'high' : n >= 65 ? 'mid' : 'low');

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm">
        <span className="text-muted">{label}</span>
        <span className="font-semibold tabular-nums text-foreground">
          {max === 10 ? `${Math.round(n * 10) / 10}/${max}` : `${Math.round(n)}%`}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn(
            'h-full rounded-full',
            band === 'high' && 'bg-brand-600',
            band === 'mid' && 'bg-orange-400',
            band === 'low' && 'bg-red-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

const MATCH_ROWS = [
  { key: 'skillMatch', label: 'Skills match' },
  { key: 'experienceMatch', label: 'Experience' },
  { key: 'educationMatch', label: 'Education' },
  { key: 'locationMatch', label: 'Location fit' },
];

export function AiMatchCard({ candidateJob }) {
  const overall = candidateJob?.overallMatch;
  const details = candidateJob?.matchDetails || {};
  const seniority = details.seniority ?? details.seniorityMatch ?? null;

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Match</h3>
            <p className="text-xs text-muted">From résumé vs job</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-brand-700">
            {overall != null ? `${Math.round(Number(overall))}%` : '—'}
          </p>
        </div>
        <div className="space-y-3">
          {MATCH_ROWS.map(({ key, label }) => (
            <ScoreBar key={key} label={label} value={candidateJob?.[key]} />
          ))}
          {seniority != null ? (
            <ScoreBar label="Seniority" value={seniority} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

const ROUND_SCORE_ROWS = [
  { key: 'communicationScore', label: 'Communication' },
  { key: 'technicalAlignment', label: 'Technical depth' },
  { key: 'roleAlignment', label: 'Problem solving' },
  { key: 'confidenceScore', label: 'Culture fit' },
  { key: 'interestLevel', label: 'Interest' },
];

function toTenScale(value) {
  if (value == null || value === '') return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return n > 10 ? n / 10 : n;
}

export function RoundScoresCard({ evaluation, onOpenScorecard }) {
  const hasScores = ROUND_SCORE_ROWS.some(({ key }) => evaluation?.[key] != null);

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="space-y-4 p-5">
        <div>
          <p className="text-xs font-medium text-emerald-700">
            {hasScores ? 'Score ready' : 'Awaiting scores'}
          </p>
          <h3 className="text-sm font-semibold text-foreground">Round 1 — AI Screen</h3>
        </div>
        {hasScores ? (
          <div className="space-y-3">
            {ROUND_SCORE_ROWS.map(({ key, label }) => (
              <ScoreBar key={key} label={label} value={toTenScale(evaluation?.[key])} max={10} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">
            Scores appear after the AI interview is completed and evaluated.
          </p>
        )}
        {onOpenScorecard ? (
          <button
            type="button"
            onClick={onOpenScorecard}
            className="text-sm font-semibold text-brand-700 hover:underline"
          >
            Open full scorecard
          </button>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function RoundHistoryCard({ hasRound1Score, overallMatch }) {
  const rounds = [
    {
      title: 'Round 1 — AI screen',
      status: hasRound1Score ? 'Scored' : 'Not started',
      score: hasRound1Score && overallMatch != null ? `${Math.round(Number(overallMatch))}%` : null,
      tone: hasRound1Score ? 'success' : 'muted',
    },
    {
      title: 'Round 2 — Technical',
      status: 'Pending recruiter',
      score: null,
      tone: 'muted',
    },
    {
      title: 'Round 3 — Culture fit',
      status: 'Not started',
      score: null,
      tone: 'muted',
    },
  ];

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="space-y-3 p-5">
        <h3 className="text-sm font-semibold text-foreground">Round history</h3>
        <ul className="space-y-2">
          {rounds.map((round) => (
            <li
              key={round.title}
              className={cn(
                'flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm',
                round.tone === 'success' ? 'bg-emerald-50' : 'bg-slate-50'
              )}
            >
              <div>
                <p className="font-medium text-foreground">{round.title}</p>
                <p className="text-xs text-muted">{round.status}</p>
              </div>
              {round.score ? (
                <span className="font-semibold tabular-nums text-emerald-700">{round.score}</span>
              ) : null}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function OutreachSummaryCard({ candidateJob }) {
  const status = getOutreachDisplayStatus(candidateJob);
  const label = formatOutreachLabel(candidateJob);

  if (status === OutreachDisplayStatus.NONE) {
    return (
      <Card className="rounded-xl border-border shadow-none">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-foreground">Outreach</h3>
          <p className="mt-2 text-sm text-muted">No outreach yet for this candidate.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-xl border-border shadow-none">
      <CardContent className="p-5">
        <h3 className="text-sm font-semibold text-foreground">Outreach</h3>
        <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
          <Mail className="h-4 w-4" aria-hidden />
          <span className="font-medium">{label}</span>
        </div>
        <p className="mt-1 text-xs text-muted">Round 1 invite</p>
      </CardContent>
    </Card>
  );
}
