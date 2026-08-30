import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Mail, RefreshCw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  createDecisionRequest,
  getDecisionQueueRequest,
  getInterviewsRequest,
  getOutreachRequest,
  inviteNextRoundRequest,
} from '@/api/recruitmentApi';

const DATE_FORMAT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, DATE_FORMAT);
}

function statusVariant(status) {
  if (['EMAIL_SENT', 'COMPLETED', 'SELECTED', 'HIRED'].includes(status)) return 'success';
  if (['FAILED', 'REJECTED_MANUALLY', 'CANCELLED', 'NO_ANSWER'].includes(status)) return 'danger';
  if (['EMAIL_QUEUED', 'SCHEDULED', 'IN_PROGRESS', 'SHORTLISTED'].includes(status)) return 'default';
  return 'muted';
}

function displayStatus(value) {
  return String(value || 'PENDING').replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
}

function CandidateLink({ candidateJob, jobId }) {
  const candidate = candidateJob?.candidate;
  const name = candidate?.name || 'Unknown candidate';
  return (
    <Link
      className="inline-flex items-center gap-2 font-medium text-foreground hover:text-brand-700 hover:underline"
      to={`/recruiter/jobs/${jobId}/candidates/${candidateJob?.candidateJobId}`}
    >
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
        {name.slice(0, 1).toUpperCase()}
      </span>
      {name}
    </Link>
  );
}

function EmptyState({ type }) {
  const copy = {
    outreach: ['No outreach yet', 'Invite eligible candidates to start a conversation.'],
    interviews: ['No interviews found', 'Scheduled and completed interviews will appear here.'],
    decisions: ['No decisions waiting', 'Candidates with completed scorecards will appear here.'],
  }[type];
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-foreground">{copy[0]}</p>
      <p className="mt-1 text-sm text-muted">{copy[1]}</p>
    </div>
  );
}

function OutreachTable({ rows, jobId }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Round</th>
            <th className="px-4 py-3 font-semibold">Channel</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Sent</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const record = row.outreachRecords?.[0];
            const round = record?.round || row.rounds?.find((item) => item.jobRound)?.jobRound;
            return (
              <tr key={row.candidateJobId} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><CandidateLink candidateJob={row} jobId={jobId} /></td>
                <td className="px-4 py-3 text-muted">{round?.name || 'Round 1'}</td>
                <td className="px-4 py-3 text-muted">{record?.channel || 'EMAIL'}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(record?.pipelineStatus)}>
                    {displayStatus(record?.pipelineStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(record?.emailSentAt || record?.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function InterviewsTable({ rows, jobId, onRefresh }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Round</th>
            <th className="px-4 py-3 font-semibold">Scheduled for</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const cj = row.candidateJob;
            const hasScorecard = Boolean(row.callRecord?.scorecard || cj?.scorecards?.length);
            return (
              <tr key={row.callScheduleId} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><CandidateLink candidateJob={cj} jobId={jobId} /></td>
                <td className="px-4 py-3 text-muted">{row.jobRound?.name || 'Round 1'}</td>
                <td className="px-4 py-3 text-muted">{formatDate(row.scheduledAt)}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(row.status)}>{displayStatus(row.status)}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/recruiter/jobs/${jobId}/candidates/${cj?.candidateJobId}`}>
                      {hasScorecard ? 'Open scorecard' : 'View profile'}
                    </Link>
                  </Button>
                  {row.status === 'SCHEDULED' && (
                    <Button variant="ghost" size="sm" onClick={onRefresh} title="Refresh interview status">
                      <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DecisionTable({ rows, jobId, onChanged }) {
  const [busyId, setBusyId] = useState(null);

  const decide = async (candidateJobId, decision) => {
    setBusyId(`${candidateJobId}:${decision}`);
    try {
      await createDecisionRequest(candidateJobId, { decision });
      toast.success(decision === 'REJECTED' ? 'Candidate rejected' : 'Decision saved');
      onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save decision');
    } finally {
      setBusyId(null);
    }
  };

  const invite = async (row) => {
    const nextRound = row.rounds
      ?.map((item) => item.jobRound)
      .filter(Boolean)
      .sort((a, b) => a.roundOrder - b.roundOrder)
      .find((round) => round.roundOrder > 1);
    if (!nextRound) {
      toast.error('No next round is configured for this job');
      return;
    }
    setBusyId(`${row.candidateJobId}:invite`);
    try {
      await inviteNextRoundRequest(row.candidateJobId, nextRound.jobRoundId);
      toast.success('Next-round invite queued');
      onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not invite candidate');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Match</th>
            <th className="px-4 py-3 font-semibold">Recommendation</th>
            <th className="px-4 py-3 font-semibold">Outreach</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const evaluation = row.scorecards?.[0]?.callRecord?.evaluation;
            const recommendation = evaluation?.recommendation || row.scorecards?.[0]?.summary?.aiRecommendation;
            const match = row.overallMatch == null ? '—' : `${Math.round(Number(row.overallMatch))}%`;
            const outreach = row.outreachRecords?.[0]?.pipelineStatus;
            return (
              <tr key={row.candidateJobId} className="hover:bg-slate-50/70">
                <td className="px-4 py-3"><CandidateLink candidateJob={row} jobId={jobId} /></td>
                <td className="px-4 py-3 font-semibold text-foreground">{match}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(recommendation)}>{displayStatus(recommendation || 'PENDING')}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(outreach)}>{displayStatus(outreach || 'NONE')}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      size="sm"
                      disabled={Boolean(busyId)}
                      onClick={() => decide(row.candidateJobId, 'SELECTED')}
                    >
                      <Check className="mr-1 h-3.5 w-3.5" aria-hidden /> Select
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={Boolean(busyId)}
                      onClick={() => decide(row.candidateJobId, 'REJECTED')}
                    >
                      <X className="mr-1 h-3.5 w-3.5" aria-hidden /> Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={Boolean(busyId)}
                      onClick={() => invite(row)}
                    >
                      <Mail className="mr-1 h-3.5 w-3.5" aria-hidden /> Next round
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function JobWorkflowTab({ jobId, type }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const request = type === 'outreach'
        ? getOutreachRequest({ jobId })
        : type === 'interviews'
          ? getInterviewsRequest({ jobId })
          : getDecisionQueueRequest({ jobId });
      const response = await request;
      setRows(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to load ${type}`);
    } finally {
      setLoading(false);
    }
  }, [jobId, type]);

  useEffect(() => {
    load();
  }, [load]);

  const title = type[0].toUpperCase() + type.slice(1);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">
            {type === 'outreach' && 'Track every candidate invitation and response.'}
            {type === 'interviews' && 'Review scheduled and completed screening calls.'}
            {type === 'decisions' && 'Review scorecards and decide the next step.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Refresh
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-card shadow-none">
        {loading && <p className="px-6 py-14 text-center text-sm text-muted">Loading {type}…</p>}
        {!loading && error && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button className="mt-3" variant="outline" size="sm" onClick={load}>Try again</Button>
          </div>
        )}
        {!loading && !error && !rows.length && <EmptyState type={type} />}
        {!loading && !error && rows.length > 0 && type === 'outreach' && (
          <OutreachTable rows={rows} jobId={jobId} />
        )}
        {!loading && !error && rows.length > 0 && type === 'interviews' && (
          <InterviewsTable rows={rows} jobId={jobId} onRefresh={load} />
        )}
        {!loading && !error && rows.length > 0 && type === 'decisions' && (
          <DecisionTable rows={rows} jobId={jobId} onChanged={load} />
        )}
      </div>
    </div>
  );
}
