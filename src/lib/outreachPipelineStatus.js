export const OutreachPipelineStatus = {
  SELECTED: 'SELECTED',
  EMAIL_QUEUED: 'EMAIL_QUEUED',
  EMAIL_SENT: 'EMAIL_SENT',
  INTERESTED: 'INTERESTED',
  DECLINED: 'DECLINED',
  SCHEDULED: 'SCHEDULED',
  FAILED: 'FAILED',
};

export const outreachPipelineLabels = {
  [OutreachPipelineStatus.SELECTED]: 'Selected',
  [OutreachPipelineStatus.EMAIL_QUEUED]: 'Email queued',
  [OutreachPipelineStatus.EMAIL_SENT]: 'Email sent',
  [OutreachPipelineStatus.INTERESTED]: 'Interested',
  [OutreachPipelineStatus.DECLINED]: 'Declined',
  [OutreachPipelineStatus.SCHEDULED]: 'Call scheduled',
  [OutreachPipelineStatus.FAILED]: 'Failed',
};
