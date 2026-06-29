import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { employmentTypeLabels } from '@/lib/employmentType';

export function JobDetailHeader({ job, onDeactivate, deactivating }) {
  if (!job) return null;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold">{job.jobTitle}</h1>
          <Badge variant={job.isActive ? 'success' : 'muted'}>
            {job.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-muted">
          {job.location} · {employmentTypeLabels[job.employmentType] || job.employmentType}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link to={`/recruiter/jobs/${job.jobId}/edit`}>Edit</Link>
        </Button>
        {job.isActive && (
          <Button
            variant="ghost"
            size="sm"
            disabled={deactivating}
            onClick={onDeactivate}
          >
            {deactivating ? 'Deactivating…' : 'Deactivate'}
          </Button>
        )}
      </div>
    </div>
  );
}
