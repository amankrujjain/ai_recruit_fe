import { CandidateStatusBadge } from '@/components/recruiter/candidates/CandidateStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { outreachPipelineLabels } from '@/lib/outreachPipelineStatus';

function formatScore(value) {
  if (value == null) return '—';
  return `${Number(value).toFixed(0)}%`;
}

export function CandidateTable({
  items,
  loading,
  selectedIds,
  onToggle,
  onToggleAll,
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading candidates…</p>;
  }

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No candidates yet. Upload an Excel file or resumes to get started.
      </p>
    );
  }

  const allSelected = items.length > 0 && items.every((c) => selectedIds.has(c.candidateJobId));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="px-3 py-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onToggleAll(e.target.checked)}
                aria-label="Select all"
              />
            </th>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">Email</th>
            <th className="px-3 py-2 font-medium">Match</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Outreach</th>
            <th className="px-3 py-2 font-medium">Selected</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const id = row.candidateJobId;
            const candidate = row.candidate || {};
            return (
              <tr key={id} className="border-b border-border/60 hover:bg-brand-50/40">
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(id)}
                    onChange={() => onToggle(id)}
                    aria-label={`Select ${candidate.name}`}
                  />
                </td>
                <td className="px-3 py-3 font-medium">{candidate.name || '—'}</td>
                <td className="px-3 py-3 text-muted">{candidate.email || '—'}</td>
                <td className="px-3 py-3">{formatScore(row.overallMatch)}</td>
                <td className="px-3 py-3">
                  <CandidateStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-3">
                  {row.outreachRecords?.[0] ? (
                    <Badge variant="default">
                      {outreachPipelineLabels[row.outreachRecords[0].pipelineStatus]
                        || row.outreachRecords[0].pipelineStatus}
                    </Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-3 py-3 text-muted">
                  {row.manuallySelected ? 'Yes' : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
