import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Pencil, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { employmentTypeLabels } from '@/lib/employmentType';

function formatLocation(location) {
  if (Array.isArray(location)) {
    return location.filter(Boolean).join(', ') || '—';
  }
  return location || '—';
}

export function JobDetailHeader({
  job,
  candidateCount,
  onDeactivate,
  onActivate,
  deactivating,
}) {
  if (!job) return null;

  const locationLabel = formatLocation(job.location);
  const typeLabel = employmentTypeLabels[job.employmentType] || job.employmentType;
  const candidatesLabel = `${candidateCount ?? 0} candidate${(candidateCount ?? 0) === 1 ? '' : 's'}`;

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        <Link to="/recruiter/jobs" className="hover:text-foreground">
          Jobs
        </Link>
        <span aria-hidden className="text-slate-300">
          /
        </span>
        <span className="truncate text-foreground">{job.jobTitle}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{job.jobTitle}</h1>
            <Badge variant={job.isActive ? 'success' : 'muted'}>
              {job.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {locationLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {typeLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
              {candidatesLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to={`/recruiter/jobs/${job.jobId}/edit`}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              Edit
            </Link>
          </Button>
          {job.isActive ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={deactivating}
              onClick={onDeactivate}
            >
              {deactivating ? 'Closing…' : 'Close job'}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={deactivating}
              onClick={onActivate}
            >
              {deactivating ? 'Activating…' : 'Activate'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
