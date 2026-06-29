import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { employmentTypeLabels } from '@/lib/employmentType';

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
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-muted">
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Location</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((job) => (
            <tr key={job.jobId} className="border-b border-border/60 hover:bg-brand-50/40">
              <td className="px-3 py-3 font-medium">{job.jobTitle}</td>
              <td className="px-3 py-3 text-muted">{job.location}</td>
              <td className="px-3 py-3 text-muted">
                {employmentTypeLabels[job.employmentType] || job.employmentType}
              </td>
              <td className="px-3 py-3">
                <Badge variant={job.isActive ? 'success' : 'muted'}>
                  {job.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-3 py-3">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/recruiter/jobs/${job.jobId}`}>View</Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/recruiter/jobs/${job.jobId}/edit`}>Edit</Link>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
