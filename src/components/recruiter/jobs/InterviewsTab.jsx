import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { getInterviewsRequest, redialCallRequest } from '@/api/recruitmentApi';
import {
  CandidateLink,
  EmptyState,
  RefreshCell,
  SelectCell,
  StatusBadge,
  WorkflowTabShell,
  formatDate,
  getSelectionHint,
} from '@/components/recruiter/jobs/workflowTabShared';
import { Button } from '@/components/ui/Button';
import {
  formatRoundLabel,
  callStatusToRoundStatus,
  pickDefaultRoundId,
} from '@/lib/formatRoundLabel';

const MAX_DIAL_ATTEMPTS = 3;

function scoringInfo(row) {
  const summary = row.callRecord?.scorecard?.summary;
  const meta = row.callRecord?.metadata;
  const status = summary?.scoringStatus || meta?.scoringStatus;
  const reason = summary?.scoringReason || meta?.scoringReason;
  return { status, reason, unable: status === 'UNABLE_TO_SCORE' || summary?.unableToScore };
}

function dialAttemptsFor(row) {
  const round = (row.candidateJob?.rounds || []).find(
    (r) => r.jobRoundId === row.jobRoundId
  );
  return Number(round?.metadata?.dialAttempts || 0);
}

function canRedial(row) {
  const terminal = ['FAILED', 'NO_ANSWER', 'COMPLETED', 'CANCELLED'].includes(row.status);
  if (!terminal) return false;
  const { reason } = scoringInfo(row);
  if (reason === 'ROLE_MISMATCH') return false;
  return true;
}

function roundLabelFor(row) {
  const candidateRound = (row.candidateJob?.rounds || []).find(
    (r) => r.jobRoundId === (row.jobRoundId || row.jobRound?.jobRoundId)
  );
  const status = candidateRound?.status || callStatusToRoundStatus(row.status);
  return formatRoundLabel(
    candidateRound?.jobRound || row.jobRound || { name: 'Round 1', roundOrder: 1 },
    status
  );
}

function InterviewsTable({
  rows,
  jobId,
  selectedIds,
  onToggle,
  onRefreshRow,
  onRedial,
  redialBusyId,
  selectedRounds,
  onSelectRound,
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="w-10 px-4 py-3"><span className="sr-only">Select</span></th>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Round</th>
            <th className="px-4 py-3 font-semibold">Scheduled for</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Action</th>
            <th className="px-4 py-3 font-semibold">Refresh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const id = row.callScheduleId;
            const cj = row.candidateJob;
            const name = cj?.candidate?.name || 'candidate';
            const hasScorecard = Boolean(row.callRecord?.scorecard || cj?.scorecards?.length);
            const score = scoringInfo(row);
            const attempts = dialAttemptsFor(row);
            const showRedial = canRedial(row);
            const needsOverride = attempts >= MAX_DIAL_ATTEMPTS;
            const rounds = cj?.rounds || [];
            const selectedRoundId = selectedRounds[cj?.candidateJobId]
              || row.jobRoundId
              || pickDefaultRoundId(rounds);
            return (
              <tr key={id} className="hover:bg-slate-50/70">
                <SelectCell
                  checked={selectedIds.has(id)}
                  onChange={() => onToggle(id)}
                  label={`Select ${name}`}
                />
                <td className="px-4 py-3"><CandidateLink candidateJob={cj} jobId={jobId} /></td>
                <td className="px-4 py-3">
                  {rounds.length > 1 ? (
                    <select
                      className="rounded border border-border bg-white px-2 py-1 text-xs"
                      value={selectedRoundId || ''}
                      onChange={(e) => onSelectRound(cj.candidateJobId, e.target.value)}
                      aria-label={`Round for ${name}`}
                    >
                      {rounds.map((r) => (
                        <option key={r.jobRoundId} value={r.jobRoundId}>
                          {formatRoundLabel(r.jobRound, r.status)}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-muted">{roundLabelFor(row)}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(row.scheduledAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <StatusBadge status={row.status} />
                    <span className="text-xs text-muted">{roundLabelFor(row)}</span>
                    {score.unable && (
                      <span className="text-xs text-amber-700">
                        Unable to score{score.reason ? `: ${score.reason.replace(/_/g, ' ').toLowerCase()}` : ''}
                      </span>
                    )}
                    {row.status === 'FAILED' && row.callRecord?.metadata?.outcomeReason && (
                      <span className="text-xs text-muted">
                        {String(row.callRecord.metadata.outcomeReason).replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/recruiter/jobs/${jobId}/candidates/${cj?.candidateJobId}`}>
                        {hasScorecard ? 'Open scorecard' : 'View profile'}
                      </Link>
                    </Button>
                    {showRedial && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={redialBusyId === id}
                        onClick={() => onRedial(row, needsOverride)}
                      >
                        {redialBusyId === id
                          ? 'Re-inviting…'
                          : needsOverride
                            ? 'Re-invite (override)'
                            : 'Re-invite'}
                      </Button>
                    )}
                  </div>
                </td>
                <RefreshCell onRefresh={() => onRefreshRow(id)} label={`Refresh ${name}`} />
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function InterviewsTab({ jobId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [redialBusyId, setRedialBusyId] = useState(null);
  const [selectedRounds, setSelectedRounds] = useState({});
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const response = await getInterviewsRequest({ jobId });
      if (requestId !== requestIdRef.current) return;
      const nextRows = response.data?.data || [];
      setRows(nextRows);
      setSelectedRounds((prev) => {
        const next = { ...prev };
        for (const row of nextRows) {
          const cjId = row.candidateJob?.candidateJobId;
          if (cjId && !next[cjId]) {
            next[cjId] = row.jobRoundId || pickDefaultRoundId(row.candidateJob?.rounds || []);
          }
        }
        return next;
      });
      setSelectedIds((current) => {
        const valid = new Set(nextRows.map((row) => row.callScheduleId));
        return new Set([...current].filter((id) => valid.has(id)));
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.response?.data?.message || 'Failed to load interviews');
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

  const handleRedial = async (row, needsOverride) => {
    let overrideReason;
    if (needsOverride) {
      overrideReason = window.prompt(
        `Max ${MAX_DIAL_ATTEMPTS} dial attempts reached. Enter a reason to override:`
      );
      if (!overrideReason?.trim()) return;
    }
    setRedialBusyId(row.callScheduleId);
    try {
      await redialCallRequest(row.callScheduleId, {
        ...(overrideReason ? { overrideReason: overrideReason.trim() } : {}),
      });
      toast.success('Re-invite queued');
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to re-invite');
    } finally {
      setRedialBusyId(null);
    }
  };

  const onSelectRound = (candidateJobId, jobRoundId) => {
    setSelectedRounds((prev) => ({ ...prev, [candidateJobId]: jobRoundId }));
  };

  // One visible row per candidate for the selected round (prefer matching schedule)
  const visibleRows = (() => {
    const byCandidate = new Map();
    for (const row of rows) {
      const cjId = row.candidateJob?.candidateJobId || row.callScheduleId;
      const wantRound = selectedRounds[cjId] || row.jobRoundId;
      const existing = byCandidate.get(cjId);
      if (!existing) {
        byCandidate.set(cjId, row);
        continue;
      }
      if (wantRound && row.jobRoundId === wantRound) {
        byCandidate.set(cjId, row);
      }
    }
    return [...byCandidate.values()];
  })();

  return (
    <WorkflowTabShell
      title="Interviews"
      description="Review scheduled and completed screening calls."
      headerHint={getSelectionHint(selectedIds.size)}
      loading={loading}
      error={error}
      empty={(
        <EmptyState
          title="No interviews found"
          description="Scheduled and completed interviews will appear here."
        />
      )}
      rows={visibleRows}
      canRefreshList={selectedIds.size > 1}
      onRefreshList={load}
    >
      <InterviewsTable
        rows={visibleRows}
        jobId={jobId}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onRefreshRow={load}
        onRedial={handleRedial}
        redialBusyId={redialBusyId}
        selectedRounds={selectedRounds}
        onSelectRound={onSelectRound}
      />
    </WorkflowTabShell>
  );
}
