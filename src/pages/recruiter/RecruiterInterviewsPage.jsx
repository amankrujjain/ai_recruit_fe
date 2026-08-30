import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, RefreshCw, Video } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getInterviewsRequest } from '@/api/recruitmentApi';

export function RecruiterInterviewsPage() {
  usePageTitle('Interviews');
  const [filter, setFilter] = useState('upcoming');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = filter === 'upcoming'
        ? { start: new Date().toISOString(), limit: 100 }
        : filter === 'completed'
          ? { status: 'COMPLETED', limit: 100 }
          : { limit: 100 };
      const response = await getInterviewsRequest(params);
      setRows(response.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="mx-auto w-full max-w-8xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Interviews</h1>
          <p className="mt-1 text-sm text-muted">All AI screening interviews across your jobs.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Refresh
        </Button>
      </div>

      <div className="flex gap-1 border-b border-border">
        {[
          ['upcoming', 'Upcoming'],
          ['completed', 'Completed'],
          ['all', 'All'],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => setFilter(value)}
            className={`border-b-2 px-4 py-2.5 text-sm font-medium ${
              filter === value
                ? 'border-brand-600 text-brand-700'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card className="rounded-xl border-border shadow-none">
        <CardContent className="p-0">
          <div className="flex items-start gap-3 border-b border-brand-100 bg-brand-50/60 px-5 py-4">
            <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" aria-hidden />
            <p className="text-sm text-slate-700">
              These interviews run automatically using the AI screening configuration for each job.
              Open a candidate profile to review the transcript and scorecard.
            </p>
          </div>
          {loading && <p className="py-16 text-center text-sm text-muted">Loading interviews…</p>}
          {!loading && error && (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <Button className="mt-3" variant="outline" size="sm" onClick={load}>Try again</Button>
            </div>
          )}
          {!loading && !error && !rows.length && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Video className="h-6 w-6" aria-hidden />
              </span>
              <p className="text-sm font-semibold text-foreground">No interviews found</p>
              <p className="text-sm text-muted">Scheduled and completed interviews will appear here.</p>
              <Button variant="outline" size="sm" asChild><Link to="/recruiter/jobs">View jobs</Link></Button>
            </div>
          )}
          {!loading && !error && rows.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Candidate</th>
                    <th className="px-5 py-3 font-semibold">Job</th>
                    <th className="px-5 py-3 font-semibold">Round</th>
                    <th className="px-5 py-3 font-semibold">Scheduled for</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {rows.map((row) => {
                    const cj = row.candidateJob;
                    const candidate = cj?.candidate;
                    return (
                      <tr key={row.callScheduleId} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <Link
                            className="font-medium text-foreground hover:text-brand-700 hover:underline"
                            to={`/recruiter/jobs/${cj?.job?.jobId}/candidates/${cj?.candidateJobId}`}
                          >
                            {candidate?.name || 'Unknown candidate'}
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-muted">{cj?.job?.jobTitle || '—'}</td>
                        <td className="px-5 py-3 text-muted">{row.jobRound?.name || 'Round 1'}</td>
                        <td className="px-5 py-3 text-muted">{formatDate(row.scheduledAt)}</td>
                        <td className="px-5 py-3">
                          <Badge variant={row.status === 'COMPLETED' ? 'success' : 'default'}>
                            {String(row.status || 'PENDING').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/recruiter/jobs/${cj?.job?.jobId}/candidates/${cj?.candidateJobId}`}>
                              {row.callRecord?.scorecard ? 'Open scorecard' : 'View profile'}
                            </Link>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
