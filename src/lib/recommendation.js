export const Recommendation = {
  STRONG_MATCH: 'STRONG_MATCH',
  PROCEED_TO_HUMAN_INTERVIEW: 'PROCEED_TO_HUMAN_INTERVIEW',
  PROCEED_WITH_CAUTION: 'PROCEED_WITH_CAUTION',
  NOT_RECOMMENDED: 'NOT_RECOMMENDED',
};

Object.freeze(Recommendation);

export const recommendationLabels = {
  [Recommendation.STRONG_MATCH]: 'Strong match',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'Proceed to human interview',
  [Recommendation.PROCEED_WITH_CAUTION]: 'Proceed with caution',
  [Recommendation.NOT_RECOMMENDED]: 'Not recommended',
};

export const recommendationVariants = {
  [Recommendation.STRONG_MATCH]: 'success',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'success',
  [Recommendation.PROCEED_WITH_CAUTION]: 'warning',
  [Recommendation.NOT_RECOMMENDED]: 'danger',
};

export const recommendationDescriptions = {
  [Recommendation.STRONG_MATCH]: 'Strong fit for this role based on the screening call.',
  [Recommendation.PROCEED_TO_HUMAN_INTERVIEW]: 'Good candidate — recommended for a human interview.',
  [Recommendation.PROCEED_WITH_CAUTION]: 'Some concerns came up — review carefully before proceeding.',
  [Recommendation.NOT_RECOMMENDED]: 'Not a good fit based on the screening conversation.',
};
