import { useCallback, useEffect, useRef, useState } from 'react';
import { Briefcase, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  createDecisionRequest,
  getDecisionQueueRequest,
  inviteNextRoundRequest,
} from '@/api/recruitmentApi';
import { CandidateStatusBadge } from '@/components/recruiter/candidates/CandidateStatusBadge';
import {
  CandidateLink,
  EmptyState,
  RefreshCell,
  SelectCell,
  WorkflowTabShell,
  displayStatus,
  getSelectionHint,
} from '@/components/recruiter/jobs/workflowTabShared';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  formatRoundLabel,
  pickDefaultRoundId,
  scorecardForRound,
} from '@/lib/formatRoundLabel';
import {
  getNextStepSuggestion,
  hasRemainingAiRounds,
  recommendationLabels,
} from '@/lib/recommendation';
import { CandidateStatus } from '@/lib/candidateStatus';

function decisionLocked(status) {
  return [CandidateStatus.HIRED, CandidateStatus.REJECTED_MANUALLY].includes(status);
}

function DecisionTable({
  rows,
  jobId,
  selectedIds,
  onToggle,
  onRefreshRow,
  onChanged,
  selectedRounds,
  onSelectRound,
}) {
  const [busyId, setBusyId] = useState(null);
  const [confirmHire, setConfirmHire] = useState(null);

  const decide = async (candidateJobId, decision) => {
    setBusyId(`${candidateJobId}:${decision}`);
    try {
      await createDecisionRequest(candidateJobId, { decision });
      toast.success(
        decision === 'REJECTED'
          ? 'Candidate rejected'
          : decision === 'HIRED'
            ? 'Candidate hired'
            : 'Decision saved'
      );
      onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not save decision');
    } finally {
      setBusyId(null);
    }
  };

  const requestHire = (row, remainingAi) => {
    if (remainingAi) {
      setConfirmHire(row);
      return;
    }
    decide(row.candidateJobId, 'HIRED');
  };

  const invite = async (row, nextRound) => {
    if (!nextRound?.jobRoundId) {
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
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="w-10 px-4 py-3"><span className="sr-only">Select</span></th>
              <th className="px-4 py-3 font-semibold">Candidate</th>
              <th className="px-4 py-3 font-semibold">Round</th>
              <th className="px-4 py-3 font-semibold">Match</th>
              <th className="px-4 py-3 font-semibold">Next step</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
              <th className="px-4 py-3 font-semibold">Refresh</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => {
              const id = row.candidateJobId;
              const name = row.candidate?.name || 'candidate';
              const rounds = row.rounds || [];
              const jobRounds = row.job?.rounds || rounds.map((r) => r.jobRound).filter(Boolean);
              const selectedRoundId = selectedRounds[id] || pickDefaultRoundId(rounds);
              const selectedRound = rounds.find((r) => r.jobRoundId === selectedRoundId);
              const scorecard = scorecardForRound(row.scorecards || [], selectedRoundId);
              const evaluation = scorecard?.callRecord?.evaluation;
              const scoringStatus = scorecard?.summary?.scoringStatus
                || scorecard?.callRecord?.metadata?.scoringStatus;
              const scoringReason = scorecard?.summary?.scoringReason
                || scorecard?.callRecord?.metadata?.scoringReason;
              const nextStep = getNextStepSuggestion({
                jobRounds,
                candidateRounds: rounds,
                evaluation,
                scoringStatus,
                scoringReason,
              });
              const fitKey = evaluation?.recommendation;
              const fitLabel = fitKey
                ? (recommendationLabels[fitKey] || displayStatus(fitKey))
                : null;
              const match = row.overallMatch == null ? '—' : `${Math.round(Number(row.overallMatch))}%`;
              const roundLabel = formatRoundLabel(
                selectedRound?.jobRound || { roundOrder: 1 },
                selectedRound?.status || 'PENDING'
              );
              const locked = decisionLocked(row.status);
              const remainingAi = hasRemainingAiRounds(jobRounds, rounds);
              const nextDisabled = locked || !nextStep.canInviteNext || Boolean(busyId);

              return (
                <tr key={id} className="hover:bg-slate-50/70">
                  <SelectCell
                    checked={selectedIds.has(id)}
                    onChange={() => onToggle(id)}
                    label={`Select ${name}`}
                  />
                  <td className="px-4 py-3"><CandidateLink candidateJob={row} jobId={jobId} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {rounds.length > 1 ? (
                        <select
                          className="rounded border border-border bg-white px-2 py-1 text-xs"
                          value={selectedRoundId || ''}
                          onChange={(e) => onSelectRound(id, e.target.value)}
                          aria-label={`Round for ${name}`}
                        >
                          {rounds.map((r) => (
                            <option key={r.jobRoundId} value={r.jobRoundId}>
                              {formatRoundLabel(r.jobRound, r.status)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-muted">{roundLabel}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground">{match}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <Badge variant={nextStep.variant === 'success' ? 'success' : nextStep.variant === 'warning' ? 'warning' : 'default'}>
                        {nextStep.label}
                      </Badge>
                      {fitLabel && fitLabel !== nextStep.label && (
                        <span className="text-xs text-muted">Fit: {fitLabel}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CandidateStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3">
                    {locked ? (
                      <span className="text-xs text-muted">Decision complete</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          disabled={Boolean(busyId)}
                          onClick={() => requestHire(row, remainingAi)}
                        >
                          <Briefcase className="mr-1 h-3.5 w-3.5" aria-hidden /> Hired
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
                          disabled={nextDisabled}
                          onClick={() => invite(row, nextStep.nextRound)}
                        >
                          <Mail className="mr-1 h-3.5 w-3.5" aria-hidden />
                          {nextStep.canInviteNext ? nextStep.label : 'Next round'}
                        </Button>
                      </div>
                    )}
                  </td>
                  <RefreshCell onRefresh={() => onRefreshRow(id)} label={`Refresh ${name}`} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={Boolean(confirmHire)}
        title="Hire before remaining AI rounds?"
        description="AI rounds remain for this job. Hiring now will skip the remaining AI screening rounds."
        confirmLabel="Hire anyway"
        cancelLabel="Cancel"
        onConfirm={() => {
          const row = confirmHire;
          setConfirmHire(null);
          if (row) decide(row.candidateJobId, 'HIRED');
        }}
        onOpenChange={(open) => {
          if (!open) setConfirmHire(null);
        }}
      />
    </>
  );
}

export function DecisionsTab({ jobId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [selectedRounds, setSelectedRounds] = useState({});
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const response = await getDecisionQueueRequest({ jobId });
      if (requestId !== requestIdRef.current) return;
      const nextRows = response.data?.data || [];
      setRows(nextRows);
      setSelectedRounds((prev) => {
        const next = { ...prev };
        for (const row of nextRows) {
          if (!next[row.candidateJobId]) {
            next[row.candidateJobId] = pickDefaultRoundId(row.rounds || []);
          }
        }
        return next;
      });
      setSelectedIds((current) => {
        const valid = new Set(nextRows.map((row) => row.candidateJobId));
        return new Set([...current].filter((id) => valid.has(id)));
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.response?.data?.message || 'Failed to load decisions');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setSelectedIds(new Set());
    setSelectedRounds({});
    load();
    return () => {
      requestIdRef.current += 1;
    };
  }, [load]);

  const toggleSelect = (id) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSelectRound = (candidateJobId, jobRoundId) => {
    setSelectedRounds((prev) => ({ ...prev, [candidateJobId]: jobRoundId }));
  };

  return (
    <WorkflowTabShell
      title="Decisions"
      description="Review scorecards and decide the next step."
      headerHint={getSelectionHint(selectedIds.size)}
      loading={loading}
      error={error}
      empty={(
        <EmptyState
          title="No decisions waiting"
          description="Candidates with completed scorecards will appear here."
        />
      )}
      rows={rows}
      canRefreshList={selectedIds.size > 1}
      onRefreshList={load}
    >
      <DecisionTable
        rows={rows}
        jobId={jobId}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onRefreshRow={load}
        onChanged={load}
        selectedRounds={selectedRounds}
        onSelectRound={onSelectRound}
      />
    </WorkflowTabShell>
  );
}
