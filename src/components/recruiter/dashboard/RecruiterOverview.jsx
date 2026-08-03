import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageBootstrap } from '@/hooks/usePageBootstrap';
import { selectAuth } from '@/store/slices/authSlice';
import { fetchDashboardStats, selectRecruitment } from '@/store/slices/recruitmentSlice';

const statCards = [
  { key: 'totalCandidates', label: 'Total candidates' },
  { key: 'candidatesRanked', label: 'AI ranked' },
  { key: 'invitationsSent', label: 'Invitations sent' },
  { key: 'callsScheduled', label: 'Calls scheduled' },
  { key: 'callsCompleted', label: 'Calls completed' },
  { key: 'shortlistedCandidates', label: 'Shortlisted' },
  { key: 'averageMatchScore', label: 'Avg match score', suffix: '%' },
  { key: 'callCompletionRate', label: 'Call completion', suffix: '%' },
];

export function RecruiterOverview() {
  const dispatch = useDispatch();
  const { account } = useSelector(selectAuth);
  const { stats } = useSelector(selectRecruitment);

  const booting = usePageBootstrap(
    () => dispatch(fetchDashboardStats()),
    [dispatch]
  );

  if (booting) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">Welcome, {account?.firstName}</h2>
          <p className="mt-1 text-sm text-muted">Your hiring pipeline at a glance.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/recruiter/jobs/new">Create job</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/recruiter/jobs">View all jobs</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, suffix }) => (
          <Card key={key}>
            <CardContent className="pt-6">
              <p className="text-2xl font-bold">
                {stats?.[key] ?? 0}{suffix || ''}
              </p>
              <p className="text-sm text-muted">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
