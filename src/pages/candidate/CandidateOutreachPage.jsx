import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  submitCandidateActionRequest,
  validateCandidateTokenRequest,
} from '@/api/candidateApi';

export function CandidateOutreachPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    validateCandidateTokenRequest(token)
      .then(({ data }) => setInfo(data.data))
      .catch((err) => toast.error(err.response?.data?.message || 'Invalid or expired link'))
      .finally(() => setLoading(false));
  }, [token]);

  const respond = async (action) => {
    setSubmitting(true);
    try {
      const { data } = await submitCandidateActionRequest(token, action);
      if (action === 'INTERESTED' || action === 'SCHEDULE') {
        toast.success('Thanks! Choose a time for your screening call.');
        navigate(`/candidate/schedule/${token}`);
        return;
      }
      setDone(data.data?.message || 'Response recorded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit response');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-sm text-muted">Loading…</CardContent>
      </Card>
    );
  }

  if (!info) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-sm text-muted">This link is invalid or expired.</CardContent>
      </Card>
    );
  }

  if (done) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader><h1 className="text-lg font-semibold">Thank you</h1></CardHeader>
        <CardContent><p className="text-sm text-muted">{done}</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <h1 className="text-lg font-semibold">Hello {info.candidateName}</h1>
        <p className="text-sm text-muted">
          {info.organizationName} · {info.jobTitle}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          We would like to invite you to a short AI screening call for this role.
          Working hours: {info.workingHoursStart}–{info.workingHoursEnd} ({info.timezone}).
          You may schedule within the next {info.maxScheduleDays} days only.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button disabled={submitting} onClick={() => respond('INTERESTED')}>
            I&apos;m interested — schedule call
          </Button>
          <Button variant="outline" disabled={submitting} onClick={() => respond('NOT_INTERESTED')}>
            Not interested
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
