import { useCallback, useEffect, useRef, useState } from 'react';
import { getOutreachRequest } from '@/api/recruitmentApi';
import {
  CandidateLink,
  EmptyState,
  RefreshCell,
  SelectCell,
  WorkflowTabShell,
  displayStatus,
  formatDate,
  getSelectionHint,
  statusVariant,
} from '@/components/recruiter/jobs/workflowTabShared';
import { Badge } from '@/components/ui/Badge';

function OutreachTable({ rows, jobId, selectedIds, onToggle, onRefreshRow }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            <th className="w-10 px-4 py-3"><span className="sr-only">Select</span></th>
            <th className="px-4 py-3 font-semibold">Candidate</th>
            <th className="px-4 py-3 font-semibold">Round</th>
            <th className="px-4 py-3 font-semibold">Channel</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Sent</th>
            <th className="px-4 py-3 font-semibold">Refresh</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const id = row.candidateJobId;
            const record = row.outreachRecords?.[0];
            const round = record?.round || row.rounds?.find((item) => item.jobRound)?.jobRound;
            const name = row.candidate?.name || 'candidate';
            return (
              <tr key={id} className="hover:bg-slate-50/70">
                <SelectCell
                  checked={selectedIds.has(id)}
                  onChange={() => onToggle(id)}
                  label={`Select ${name}`}
                />
                <td className="px-4 py-3"><CandidateLink candidateJob={row} jobId={jobId} /></td>
                <td className="px-4 py-3 text-muted">{round?.name || 'Round 1'}</td>
                <td className="px-4 py-3 text-muted">{record?.channel || 'EMAIL'}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant(record?.pipelineStatus)}>
                    {displayStatus(record?.pipelineStatus)}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(record?.emailSentAt || record?.createdAt)}
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

export function OutreachTab({ jobId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');
    try {
      const response = await getOutreachRequest({ jobId });
      if (requestId !== requestIdRef.current) return;
      const nextRows = response.data?.data || [];
      setRows(nextRows);
      setSelectedIds((current) => {
        const valid = new Set(nextRows.map((row) => row.candidateJobId));
        return new Set([...current].filter((id) => valid.has(id)));
      });
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.response?.data?.message || 'Failed to load outreach');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    setSelectedIds(new Set());
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

  return (
    <WorkflowTabShell
      title="Outreach"
      description="Track every candidate invitation and response. Scheduled means booked, not call result."
      headerHint={getSelectionHint(selectedIds.size)}
      loading={loading}
      error={error}
      empty={(
        <EmptyState
          title="No outreach yet"
          description="Invite candidates from the Candidates tab. Outreach shows delivery status here."
        />
      )}
      rows={rows}
      canRefreshList={selectedIds.size > 1}
      onRefreshList={load}
    >
      <OutreachTable
        rows={rows}
        jobId={jobId}
        selectedIds={selectedIds}
        onToggle={toggleSelect}
        onRefreshRow={load}
      />
    </WorkflowTabShell>
  );
}
