const ROUND_STATUS_LABELS = {
  PENDING: 'Pending',
  INVITED: 'Invited',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
  CLEARED: 'Cleared',
  // call-schedule aliases when mapping before candidate_rounds write
  SCHEDULED: 'Scheduled',
  NO_ANSWER: 'Failed',
  CANCELLED: 'Cancelled',
};

/**
 * C4: `{Round name|Round N} — {state}`
 * @param {{ name?: string, roundOrder?: number }|null} round
 * @param {string|null|undefined} status CandidateRoundStatus or call schedule status
 */
export function formatRoundLabel(round, status) {
  const order = round?.roundOrder;
  const name = String(round?.name || '').trim()
    || (order != null ? `Round ${order}` : 'Round');
  const key = String(status || 'PENDING').toUpperCase();
  const state = ROUND_STATUS_LABELS[key]
    || key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  return `${name} — ${state}`;
}

/** Map call-schedule status → candidate round display status. */
export function callStatusToRoundStatus(callStatus) {
  const key = String(callStatus || '').toUpperCase();
  if (key === 'COMPLETED') return 'COMPLETED';
  if (key === 'FAILED' || key === 'NO_ANSWER') return 'FAILED';
  if (key === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (key === 'CANCELLED') return 'CANCELLED';
  if (key === 'SCHEDULED' || key === 'RESCHEDULED') return 'INVITED';
  return key || 'PENDING';
}

export function pickDefaultRoundId(rounds = []) {
  if (!rounds.length) return null;
  const sorted = [...rounds].sort(
    (a, b) => (a.jobRound?.roundOrder || 0) - (b.jobRound?.roundOrder || 0)
  );
  const current = [...sorted].reverse().find((r) =>
    ['IN_PROGRESS', 'INVITED', 'COMPLETED', 'FAILED'].includes(String(r.status || '').toUpperCase())
  );
  return (current || sorted[sorted.length - 1])?.jobRoundId || null;
}

export function scorecardForRound(scorecards = [], jobRoundId) {
  if (!jobRoundId) return scorecards[0] || null;
  return scorecards.find((sc) => sc.jobRoundId === jobRoundId)
    || scorecards.find((sc) => sc.callRecord?.callSchedule?.jobRoundId === jobRoundId)
    || null;
}
