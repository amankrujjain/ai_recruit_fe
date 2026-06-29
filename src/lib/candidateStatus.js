export const CandidateStatus = {
  UPLOADED: 'UPLOADED',
  AI_MATCHED: 'AI_MATCHED',
  INVITED: 'INVITED',
  INTERESTED: 'INTERESTED',
  CALL_SCHEDULED: 'CALL_SCHEDULED',
  CALL_COMPLETED: 'CALL_COMPLETED',
  SHORTLISTED: 'SHORTLISTED',
  HUMAN_INTERVIEW: 'HUMAN_INTERVIEW',
  HIRED: 'HIRED',
  REJECTED_MANUALLY: 'REJECTED_MANUALLY',
};

Object.freeze(CandidateStatus);

export const candidateStatusLabels = {
  [CandidateStatus.UPLOADED]: 'Uploaded',
  [CandidateStatus.AI_MATCHED]: 'AI matched',
  [CandidateStatus.INVITED]: 'Invited',
  [CandidateStatus.INTERESTED]: 'Interested',
  [CandidateStatus.CALL_SCHEDULED]: 'Call scheduled',
  [CandidateStatus.CALL_COMPLETED]: 'Call completed',
  [CandidateStatus.SHORTLISTED]: 'Shortlisted',
  [CandidateStatus.HUMAN_INTERVIEW]: 'Human interview',
  [CandidateStatus.HIRED]: 'Hired',
  [CandidateStatus.REJECTED_MANUALLY]: 'Rejected',
};

export const candidateStatusVariants = {
  [CandidateStatus.UPLOADED]: 'muted',
  [CandidateStatus.AI_MATCHED]: 'default',
  [CandidateStatus.INVITED]: 'default',
  [CandidateStatus.INTERESTED]: 'success',
  [CandidateStatus.CALL_SCHEDULED]: 'warning',
  [CandidateStatus.CALL_COMPLETED]: 'success',
  [CandidateStatus.SHORTLISTED]: 'success',
  [CandidateStatus.HUMAN_INTERVIEW]: 'warning',
  [CandidateStatus.HIRED]: 'success',
  [CandidateStatus.REJECTED_MANUALLY]: 'muted',
};
