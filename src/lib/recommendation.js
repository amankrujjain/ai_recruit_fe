export const Recommendation = {
  STRONG_MATCH: 'STRONG_MATCH',
  PROCEED_TO_HUMAN_INTERVIEW: 'PROCEED_TO_HUMAN_INTERVIEW',
  PROCEED_WITH_CAUTION: 'PROCEED_WITH_CAUTION',
  NOT_RECOMMENDED: 'NOT_RECOMMENDED',
  ROLE_MISMATCH: 'ROLE_MISMATCH',
};

Object.freeze(Recommendation);

export const recommendationLabels = {
  [Recommendation.STRONG_MATCH]: 'Strong match',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'Proceed to human interview',
  [Recommendation.PROCEED_WITH_CAUTION]: 'Proceed with caution',
  [Recommendation.NOT_RECOMMENDED]: 'Not recommended',
  [Recommendation.ROLE_MISMATCH]: 'Role mismatch',
};

export const recommendationVariants = {
  [Recommendation.STRONG_MATCH]: 'success',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'success',
  [Recommendation.PROCEED_WITH_CAUTION]: 'warning',
  [Recommendation.NOT_RECOMMENDED]: 'danger',
  [Recommendation.ROLE_MISMATCH]: 'warning',
};

export const recommendationDescriptions = {
  [Recommendation.STRONG_MATCH]: 'Strong fit for this role based on the screening call.',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'Good candidate — recommended for a human interview.',
  [Recommendation.PROCEED_WITH_CAUTION]: 'Some concerns came up — review carefully before proceeding.',
  [Recommendation.NOT_RECOMMENDED]: 'Not a good fit based on the screening conversation.',
  [Recommendation.ROLE_MISMATCH]: 'Call completed but candidate is not a skill-scorable fit for this JD.',
};

const formatUnableReason = (reason) => {
  const key = String(reason || 'UNABLE_TO_SCORE').toUpperCase();
  if (key === 'ROLE_MISMATCH') return 'Unable to skill-score: role mismatch';
  return `Unable to score: ${key.replace(/_/g, ' ').toLowerCase()}`;
};

/**
 * Resolve job round definitions from job.rounds or nested candidateRounds.jobRound.
 */
export function resolveJobRounds(jobRounds, candidateRounds = []) {
  if (Array.isArray(jobRounds) && jobRounds.length) {
    return [...jobRounds].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));
  }
  const fromCandidate = (candidateRounds || [])
    .map((cr) => cr.jobRound)
    .filter(Boolean);
  const byId = new Map();
  for (const jr of fromCandidate) {
    if (jr.jobRoundId) byId.set(jr.jobRoundId, jr);
  }
  return [...byId.values()].sort((a, b) => (a.roundOrder || 0) - (b.roundOrder || 0));
}

/**
 * Next AI JobRound to invite after completed/cleared progress.
 */
export function findNextAiJobRound(jobRounds, candidateRounds = []) {
  const rounds = resolveJobRounds(jobRounds, candidateRounds).filter(
    (r) => String(r.roundType || 'AI').toUpperCase() !== 'HUMAN'
  );
  if (!rounds.length) return null;

  const maxDoneOrder = Math.max(
    0,
    ...(candidateRounds || []).map((cr) => {
      const status = String(cr.status || '').toUpperCase();
      if (!['CLEARED', 'COMPLETED'].includes(status)) return 0;
      return cr.jobRound?.roundOrder || 0;
    })
  );

  return rounds.find((r) => (r.roundOrder || 0) > maxDoneOrder) || null;
}

/**
 * C9: code-derived Decision next-step (LLM fit is secondary).
 */
export function getNextStepSuggestion({
  jobRounds,
  candidateRounds = [],
  evaluation,
  scoringStatus,
  scoringReason,
} = {}) {
  const unableStatus = String(scoringStatus || '').toUpperCase() === 'UNABLE_TO_SCORE';
  const reason = scoringReason
    || evaluation?.rawAiResponse?.scoringReason
    || (String(evaluation?.recommendation || '').toUpperCase() === 'ROLE_MISMATCH'
      ? 'ROLE_MISMATCH'
      : null)
    || (evaluation?.roleMismatch ? 'ROLE_MISMATCH' : null);

  if (unableStatus || reason) {
    return {
      code: 'UNABLE_TO_SCORE',
      label: formatUnableReason(reason || 'UNABLE_TO_SCORE'),
      variant: 'warning',
      nextRound: null,
      canInviteNext: false,
    };
  }

  const nextRound = findNextAiJobRound(jobRounds, candidateRounds);
  if (nextRound) {
    const name = String(nextRound.name || '').trim() || `Round ${nextRound.roundOrder}`;
    return {
      code: 'INVITE_NEXT_ROUND',
      label: `Invite to ${name}`,
      variant: 'default',
      nextRound,
      canInviteNext: true,
    };
  }

  const fitKey = evaluation?.recommendation;
  const fitLabel = fitKey ? (recommendationLabels[fitKey] || null) : null;

  return {
    code: 'PROCEED_TO_HUMAN',
    label: 'Proceed to human interview',
    variant: 'success',
    nextRound: null,
    canInviteNext: false,
    fitLabel,
  };
}

/** True when at least one AI JobRound remains after completed/cleared progress. */
export function hasRemainingAiRounds(jobRounds, candidateRounds = []) {
  return Boolean(findNextAiJobRound(jobRounds, candidateRounds));
}
