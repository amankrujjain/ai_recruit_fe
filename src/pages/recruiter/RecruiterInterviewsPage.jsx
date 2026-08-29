import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import { usePageTitle } from '@/context/PageTitleContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/** Stub until the Interviews Figma screen is implemented. */
export function RecruiterInterviewsPage() {
  usePageTitle('Interviews');

  return (
    <div className="mx-auto max-w-3xl">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Video className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Interviews</h2>
            <p className="mt-1 text-sm text-muted">
              Org-wide interview calendar is coming next. For now, open a job to review scheduled calls.
            </p>
          </div>
          <Button asChild>
            <Link to="/recruiter/jobs">View jobs</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
