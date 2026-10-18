import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  resolveInterviewInviteRequest,
  startInterviewInviteRequest,
} from '@/api/interviewInviteApi';

export function InterviewInvitePage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(null);

  useEffect(() => {
    resolveInterviewInviteRequest(token)
      .then(({ data }) => {
        setInfo(data.data);
        setError(null);
      })
      .catch((err) => {
        const status = err.response?.status;
        const message =
          err.response?.data?.message
          || (status === 410
            ? 'This invite has expired or is no longer valid. Ask the recruiter to resend.'
            : 'Invalid or expired link');
        setError(message);
        toast.error(message);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const onStart = async () => {
    setStarting(true);
    try {
      const { data } = await startInterviewInviteRequest(token, phone.trim() || undefined);
      setStarted(data.data);
      toast.success(
        data.data?.reused
          ? 'Your interview call is already in progress.'
          : 'We are calling you now — please keep your phone ready.'
      );
    } catch (err) {
      const code = err.response?.data?.code;
      const message =
        code === 'CAPACITY'
          ? (err.response?.data?.message
            || 'All interview lines are busy right now. Please try again in a few minutes.')
          : (err.response?.data?.message || 'Could not start the interview');
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="pt-6 text-sm text-muted">Loading invite…</CardContent>
      </Card>
    );
  }

  if (error || !info) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <h1 className="text-lg font-semibold">Invite unavailable</h1>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted">
            {error || 'This link is invalid or expired. Ask the recruiter to resend a new invite.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (started) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <h1 className="text-lg font-semibold">Calling you now</h1>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted">
          <p>
            Keep your phone nearby. Attempt {started.attemptsUsed} of {started.maxAttempts}.
          </p>
          <p>If you miss the call, you can return to this link while it is still valid and try again.</p>
        </CardContent>
      </Card>
    );
  }

  const expiresLabel = info.expiresAt
    ? new Date(info.expiresAt).toLocaleString()
    : null;

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <h1 className="text-lg font-semibold">
          {info.candidateName ? `Hello ${info.candidateName}` : 'AI screening invite'}
        </h1>
        <p className="text-sm text-muted">
          {[info.organizationName, info.jobTitle, info.roundName].filter(Boolean).join(' · ')}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          When you tap Start, we will place an AI screening call to your phone.
          You can start anytime before the link expires
          {expiresLabel ? ` (${expiresLabel})` : ''}.
        </p>
        <p className="text-xs text-muted">
          Attempts used: {info.attemptsUsed} / {info.maxAttempts}
          {info.phoneHint ? ` · On file: ${info.phoneHint}` : ''}
        </p>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Phone (E.164 or local)</span>
          <input
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            placeholder={info.phoneHint ? 'Leave blank to use number on file' : '+91…'}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        <Button type="button" disabled={starting} onClick={onStart} className="w-full">
          {starting ? 'Starting…' : 'Start interview'}
        </Button>
      </CardContent>
    </Card>
  );
}
