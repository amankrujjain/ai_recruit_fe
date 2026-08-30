import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { usePageTitle } from '@/context/PageTitleContext';
import { InterviewScorecardDrawer } from '@/components/recruiter/candidates/InterviewScorecardDrawer';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  CandidateProfileBreadcrumb,
  CandidateProfileHeader,
} from '@/components/recruiter/candidates/profile/CandidateProfileHeader';
import { CandidatePipelineStepper } from '@/components/recruiter/candidates/profile/CandidatePipelineStepper';
import {
  AiMatchCard,
  OutreachSummaryCard,
  RoundHistoryCard,
  RoundScoresCard,
} from '@/components/recruiter/candidates/profile/CandidateProfileCards';
import { CandidateProfileFooter } from '@/components/recruiter/candidates/profile/CandidateProfileFooter';
import { getCandidateRequest } from '@/api/jobApi';
import {
  getCallRecordsRequest,
  getScorecardRequest,
  createDecisionRequest,
  inviteNextRoundRequest,
} from '@/api/recruitmentApi';
import { CandidateStatus } from '@/lib/candidateStatus';
import { fetchJob, selectJobs } from '@/store/slices/jobsSlice';

export function CandidateProfilePage() {
  const { jobId, candidateJobId } = useParams();
  const dispatch = useDispatch();
  const { current: jobFromStore, detailLoading } = useSelector(selectJobs);

  const [candidateJob, setCandidateJob] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [callRecords, setCallRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [scorecardOpen, setScorecardOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const candidateName = candidateJob?.candidate?.name || 'Candidate';
  const job = candidateJob?.job || jobFromStore;
  usePageTitle(candidateName);

  const load = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    try {
      const [candidateRes, scoreRes, callsRes] = await Promise.all([
        getCandidateRequest(jobId, candidateJobId),
        getScorecardRequest(candidateJobId).catch(() => ({ data: { data: null } })),
        getCallRecordsRequest(candidateJobId).catch(() => ({ data: { data: [] } })),
      ]);
      setCandidateJob(candidateRes.data?.data ?? null);
      setScorecard(scoreRes.data?.data ?? null);
      setCallRecords(callsRes.data?.data ?? []);
      if (!candidateRes.data?.data) setNotFound(true);
    } catch (err) {
      setNotFound(true);
      setCandidateJob(null);
      toast.error(err.response?.data?.message || 'Failed to load candidate');
    } finally {
      setLoading(false);
    }
  }, [jobId, candidateJobId]);

  useEffect(() => {
    dispatch(fetchJob(jobId));
  }, [dispatch, jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const callRecord = scorecard?.callRecord || callRecords[0] || null;
  const evaluation = callRecord?.evaluation || null;
  const hasScorecard = Boolean(
    evaluation
    || scorecard?.summary
    || (candidateJob?.scorecards && candidateJob.scorecards.length)
  );
  const hasRound1Score = ROUND_HAS_SCORE(evaluation);

  const applyStatus = async (status, successMessage) => {
    const decisionByStatus = {
      [CandidateStatus.SHORTLISTED]: 'SELECTED',
      [CandidateStatus.REJECTED_MANUALLY]: 'REJECTED',
      [CandidateStatus.HIRED]: 'HIRED',
    };
    setSaving(true);
    try {
      await createDecisionRequest(candidateJobId, {
        decision: decisionByStatus[status],
      });
      setCandidateJob((prev) => (prev ? { ...prev, status } : prev));
      toast.success(successMessage);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    if (confirm.type === 'invite-next') {
      setSaving(true);
      try {
        await inviteNextRoundRequest(candidateJobId, confirm.roundId);
        toast.success('Next-round invite queued');
        await load();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to invite candidate');
      } finally {
        setSaving(false);
        setConfirm(null);
      }
      return;
    }
    await applyStatus(confirm.status, confirm.successMessage);
  };

  if (loading || detailLoading) {
    return <PageContentSkeleton />;
  }

  if (notFound || !candidateJob) {
    return (
      <div className="mx-auto w-full max-w-8xl space-y-4 py-12 text-center">
        <p className="text-sm font-medium text-foreground">Candidate not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/recruiter/jobs/${jobId}?tab=candidates`}>Back to candidates</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-8xl flex-col gap-5 pb-28">
      <CandidateProfileBreadcrumb job={job} candidateName={candidateName} />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {job?.jobTitle || 'Job'}
        </h1>
        <Badge variant={job?.isActive ? 'success' : 'muted'}>
          {job?.isActive ? 'Active' : 'Inactive'}
        </Badge>
      </div>

      <CandidateProfileHeader candidateJob={candidateJob} job={job} />

      <div className="rounded-xl border border-border bg-card px-4 py-5">
        <CandidatePipelineStepper candidateJob={candidateJob} hasScorecard={hasScorecard} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
        <RoundScoresCard
          evaluation={evaluation}
          onOpenScorecard={() => setScorecardOpen(true)}
        />
        <div className="space-y-5">
          <AiMatchCard candidateJob={candidateJob} />
          <RoundHistoryCard
            hasRound1Score={hasRound1Score}
            overallMatch={candidateJob.overallMatch}
          />
          <OutreachSummaryCard candidateJob={candidateJob} />
        </div>
      </div>

      <CandidateProfileFooter
        saving={saving}
        onInviteNext={() => {
          const currentRound = candidateJob.rounds?.[candidateJob.rounds.length - 1]?.jobRound;
          const nextRound = job?.rounds?.find(
            (round) => round.roundOrder > (currentRound?.roundOrder || 1)
          );
          if (!nextRound) {
            toast.error('No next round is configured for this job');
            return;
          }
          setConfirm({
            type: 'invite-next',
            roundId: nextRound.jobRoundId,
            title: `Invite to ${nextRound.name}?`,
            description: 'This will queue the configured outreach for the next recruitment round.',
            confirmLabel: 'Invite to next round',
            successMessage: 'Next-round invite queued',
          });
        }}
        onMarkSelected={() =>
          setConfirm({
            status: CandidateStatus.SHORTLISTED,
            title: 'Mark as selected?',
            description: 'This marks the candidate as shortlisted for this job.',
            confirmLabel: 'Mark selected',
            successMessage: 'Candidate marked as selected',
          })
        }
        onReject={() =>
          setConfirm({
            status: CandidateStatus.REJECTED_MANUALLY,
            title: 'Reject candidate?',
            description: 'This will mark the candidate as rejected for this job.',
            confirmLabel: 'Reject',
            variant: 'danger',
            successMessage: 'Candidate rejected',
          })
        }
        onHire={() =>
          setConfirm({
            status: CandidateStatus.HIRED,
            title: 'Hire candidate?',
            description: 'This marks the candidate as hired for this job.',
            confirmLabel: 'Hire',
            successMessage: 'Candidate hired',
          })
        }
      />

      <InterviewScorecardDrawer
        open={scorecardOpen}
        candidateJobId={candidateJobId}
        candidateName={candidateName}
        onOpenChange={setScorecardOpen}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.title}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        cancelLabel="Cancel"
        variant={confirm?.variant || 'default'}
        onConfirm={handleConfirm}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
      />
    </div>
  );
}

function ROUND_HAS_SCORE(evaluation) {
  if (!evaluation) return false;
  return [
    'communicationScore',
    'technicalAlignment',
    'roleAlignment',
    'confidenceScore',
    'interestLevel',
  ].some((key) => evaluation[key] != null);
}
