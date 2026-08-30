import { Info } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';

const DEFAULT_MAX_AI_ROUNDS = 3;

function PipelineRow({ label, value, valueClassName }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-muted">{label}</span>
      <span className={`text-lg font-semibold tabular-nums ${valueClassName || 'text-foreground'}`}>
        {value}
      </span>
    </div>
  );
}

export function JobOverviewTab({ job, stats, matchThreshold = 80 }) {
  const skills = job?.mandatorySkills || [];
  const cvsUploaded = stats?.totalCandidates ?? stats?.candidatesUploaded ?? 0;
  const eligible = stats?.eligibleMatch ?? 0;
  const outreachSent = stats?.invitationsSent ?? 0;
  const callsCompleted = stats?.callsCompleted ?? 0;
  const threshold = stats?.matchThreshold ?? matchThreshold;

  const configuredRounds = job?.rounds?.length
    ? job.rounds
    : ((job?.aiRounds?.length ? job.aiRounds : [{ name: 'AI screening', roundType: 'AI' }]).map((round, index) => ({
      ...round,
      roundOrder: index + 1,
      name: round.name || `Round ${index + 1}`,
    })));
  const rounds = configuredRounds.slice(0, DEFAULT_MAX_AI_ROUNDS).map((round, index) => {
    if (index === 0) {
      const active = callsCompleted > 0 || (stats?.callsScheduled ?? 0) > 0;
      return {
        label: `Round ${round.roundOrder || index + 1} — ${round.name}`,
        completed: callsCompleted,
        status: active ? 'Active' : 'Not started',
        active,
      };
    }
    return {
      label: `Round ${round.roundOrder || index + 1} — ${round.name}`,
      completed: 0,
      status: 'Not started',
      active: false,
    };
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="space-y-5 p-6">
            <h2 className="text-base font-semibold text-foreground">Job description</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {job?.jobDescription || '—'}
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Required skills</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {skills.length ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted">No required skills listed.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-start gap-3 rounded-xl border border-brand-100 bg-brand-50/70 px-4 py-3 text-sm text-slate-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
          <p>
            This job has {rounds.length || DEFAULT_MAX_AI_ROUNDS} configured AI round(s). You can stop after any scored
            round and advance candidates manually.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">Pipeline summary</h2>
            <div className="mt-2 divide-y divide-border">
              <PipelineRow label="CVs uploaded" value={cvsUploaded} />
              <PipelineRow
                label={`≥ ${threshold}% match`}
                value={eligible}
                valueClassName="text-brand-600"
              />
              <PipelineRow
                label="Outreach sent"
                value={outreachSent}
                valueClassName="text-emerald-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border shadow-none">
          <CardContent className="p-5">
            <h2 className="text-sm font-semibold text-foreground">AI rounds</h2>
            <ul className="mt-3 space-y-2">
              {rounds.map((round) => (
                <li
                  key={round.label}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{round.label}</p>
                    <p className="text-xs text-muted">{round.completed} completed</p>
                  </div>
                  {round.active ? (
                    <Badge variant="default">Active</Badge>
                  ) : (
                    <span className="text-xs font-medium text-muted">{round.status}</span>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
