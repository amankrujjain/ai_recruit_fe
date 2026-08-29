import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function DashboardHeader({ orgName }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-0.5 text-sm text-muted">
          {orgName || 'Your organization'} · all active jobs
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <a
          href="#todays-interviews"
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Today&apos;s interviews
        </a>
        <Button variant="outline" size="sm" asChild>
          <Link to="/recruiter/jobs">View jobs</Link>
        </Button>
        <Button size="sm" asChild>
          <Link to="/recruiter/jobs/new">
            <Plus className="mr-1.5 h-4 w-4" />
            Create job
          </Link>
        </Button>
      </div>
    </div>
  );
}
