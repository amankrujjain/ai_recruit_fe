import { Trash2 } from 'lucide-react';
import { CandidateStatusBadge } from '@/components/recruiter/candidates/CandidateStatusBadge';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { outreachPipelineLabels } from '@/lib/outreachPipelineStatus';

function formatScore(value) {
  if (value == null) return '—';
  return `${Number(value).toFixed(0)}%`;
}

export function CandidateTable({
  items,
  loading,
  selectedIds,
  deletingId,
  onToggle,
  onToggleAll,
  onDelete,
}) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading candidates…</p>;
  }

  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        No candidates yet. Upload resumes to get started.
      </p>
    );
  }

  const allSelected = items.length > 0 && items.every((c) => selectedIds.has(c.candidateJobId));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] text-left text-sm">
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
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => {
            const id = row.candidateJobId;
            const candidate = row.candidate || {};
            const deleting = deletingId === id;
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
                <td className="px-3 py-3">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    disabled={deleting}
                    aria-label={`Remove ${candidate.name || 'candidate'}`}
                    onClick={() => onDelete?.(row)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="ml-1">{deleting ? 'Removing…' : 'Delete'}</span>
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
