import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const DATE_FORMAT = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
};

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString(undefined, DATE_FORMAT);
}

export function statusVariant(status) {
  if (['EMAIL_SENT', 'COMPLETED', 'SELECTED', 'HIRED'].includes(status)) return 'success';
  if (['FAILED', 'REJECTED_MANUALLY', 'CANCELLED', 'NO_ANSWER'].includes(status)) return 'danger';
  if (['EMAIL_QUEUED', 'SCHEDULED', 'IN_PROGRESS', 'SHORTLISTED'].includes(status)) return 'default';
  return 'muted';
}

export function displayStatus(value) {
  return String(value || 'PENDING')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

export function CandidateLink({ candidateJob, jobId }) {
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

export function EmptyState({ title, description }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

export function SelectCell({ checked, onChange, label }) {
  return (
    <td className="px-4 py-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="rounded border-border"
      />
    </td>
  );
}

export function RefreshCell({ onRefresh, label }) {
  return (
    <td className="px-4 py-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        title={label}
        aria-label={label}
      >
        <RefreshCw className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </td>
  );
}

export function StatusBadge({ status }) {
  return <Badge variant={statusVariant(status)}>{displayStatus(status)}</Badge>;
}

export function WorkflowTabShell({
  title,
  description,
  headerHint,
  loading,
  error,
  empty,
  rows,
  canRefreshList,
  onRefreshList,
  children,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRefreshList}
          disabled={loading || !canRefreshList}
          title={
            canRefreshList
              ? 'Refresh selected candidates'
              : 'Select more than one candidate to refresh the list'
          }
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Refresh list
        </Button>
      </div>
      {rows.length > 0 && !loading && !error ? (
        <p className="text-xs text-muted">{headerHint}</p>
      ) : null}
      <div className="rounded-xl border border-border bg-card shadow-none">
        {loading && (
          <p className="px-6 py-14 text-center text-sm text-muted">Loading…</p>
        )}
        {!loading && error && (
          <div className="px-6 py-14 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <Button className="mt-3" variant="outline" size="sm" onClick={onRefreshList}>
              Try again
            </Button>
          </div>
        )}
        {!loading && !error && !rows.length && empty}
        {!loading && !error && rows.length > 0 && children}
      </div>
    </div>
  );
}

export function getSelectionHint(selectedCount) {
  if (selectedCount > 1) return `${selectedCount} selected — refresh list available`;
  if (selectedCount === 1) {
    return 'Use the row Refresh button, or select more than one for Refresh list';
  }
  return 'Select more than one candidate to enable Refresh list';
}
