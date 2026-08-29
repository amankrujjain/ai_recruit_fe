import { Link } from 'react-router-dom';
import { Eye, Pencil, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { employmentTypeLabels } from '@/lib/employmentType';

function formatLocation(location) {
  if (Array.isArray(location)) {
    const joined = location.filter(Boolean).join(', ');
    return joined || '—';
  }
  return location || '—';
}

function PipelineCell({ pipeline }) {
  const candidates = pipeline?.candidates ?? 0;
  const invited = pipeline?.invited ?? 0;
  const callsScheduled = pipeline?.callsScheduled ?? 0;

  return (
    <div className="leading-snug">
      <p className="font-medium text-foreground">
        {candidates} candidate{candidates === 1 ? '' : 's'}
      </p>
      <p className="text-xs text-muted">
        {invited} invited · {callsScheduled} calls scheduled
      </p>
    </div>
  );
}

export function JobTable({ items, loading }) {
  if (loading) {
    return <p className="py-8 text-center text-sm text-muted">Loading jobs…</p>;
  }

  if (!items.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted">No jobs yet.</p>
        <Button asChild className="mt-4">
          <Link to="/recruiter/jobs/new">Create your first job</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Job title
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Location
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Type
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Pipeline
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted">
              Status
            </th>
            <th className="px-5 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => {
            const locationLabel = formatLocation(job.location);
            return (
              <tr
                key={job.jobId}
                className="border-b border-border last:border-b-0 hover:bg-slate-50/80"
              >
                <td className="px-5 py-4 font-semibold text-foreground">{job.jobTitle}</td>
                <td className="px-5 py-4 text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
                    {locationLabel}
                  </span>
                </td>
                <td className="px-5 py-4 text-muted">
                  {employmentTypeLabels[job.employmentType] || job.employmentType}
                </td>
                <td className="px-5 py-4">
                  <PipelineCell pipeline={job.pipeline} />
                </td>
                <td className="px-5 py-4">
                  <Badge variant={job.isActive ? 'success' : 'muted'}>
                    {job.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 border-border bg-white px-3 text-foreground shadow-none"
                      asChild
                    >
                      <Link to={`/recruiter/jobs/${job.jobId}`}>
                        <Eye className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        View
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-3 text-brand-700"
                      asChild
                    >
                      <Link to={`/recruiter/jobs/${job.jobId}/edit`}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        Edit
                      </Link>
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
