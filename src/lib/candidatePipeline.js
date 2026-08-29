import { CandidateStatus } from '@/lib/candidateStatus';

export const PIPELINE_STEPS = Object.freeze([
  { id: 'uploaded', label: 'Uploaded' },
  { id: 'matched', label: 'Matched' },
  { id: 'outreach', label: 'Outreach sent' },
  { id: 'booked', label: 'Booked' },
  { id: 'interviewed', label: 'Interviewed' },
  { id: 'score_ready', label: 'Score ready' },
]);

const STATUS_RANK = {
  [CandidateStatus.UPLOADED]: 0,
  [CandidateStatus.AI_MATCHED]: 1,
  [CandidateStatus.INVITED]: 2,
  [CandidateStatus.INTERESTED]: 2,
  [CandidateStatus.CALL_SCHEDULED]: 3,
  [CandidateStatus.CALL_COMPLETED]: 4,
  [CandidateStatus.SHORTLISTED]: 5,
  [CandidateStatus.HUMAN_INTERVIEW]: 5,
  [CandidateStatus.HIRED]: 6,
  [CandidateStatus.REJECTED_MANUALLY]: 6,
};

/**
 * Pipeline step states from candidate-job status + related data.
 * Invited / unmatched / unscored candidates only light completed steps.
 */
export function getPipelineSteps(candidateJob, { hasScorecard = false } = {}) {
  const status = candidateJob?.status || CandidateStatus.UPLOADED;
  const rank = STATUS_RANK[status] ?? 0;
  const matched = candidateJob?.overallMatch != null || rank >= 1;
  const outreached = Boolean(candidateJob?.outreachRecords?.length) || rank >= 2;
  const booked = Boolean(candidateJob?.callSchedules?.length) || rank >= 3;
  const interviewed = rank >= 4;
  const scoreReady = hasScorecard || rank >= 5;

  const doneFlags = [true, matched, outreached, booked, interviewed, scoreReady];
  let currentIndex = doneFlags.findIndex((done) => !done);
  if (currentIndex === -1) currentIndex = doneFlags.length - 1;

  return PIPELINE_STEPS.map((step, index) => ({
    ...step,
    index,
    state:
      index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'pending',
  }));
}
