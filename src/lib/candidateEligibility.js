export const DEFAULT_ELIGIBILITY_THRESHOLD = 80;

/** Match bar color bands (independent of eligibility slider). */
export const MATCH_SCORE_BAND = Object.freeze({
  HIGH: 'HIGH', // ≥ 80
  MID: 'MID', // 65–79
  LOW: 'LOW', // < 65
});

/** @typedef {'PENDING' | 'ELIGIBLE' | 'NOT_ELIGIBLE'} EligibilityStatusValue */

export const EligibilityStatus = Object.freeze({
  PENDING: 'PENDING',
  ELIGIBLE: 'ELIGIBLE',
  NOT_ELIGIBLE: 'NOT_ELIGIBLE',
});

export function getMatchScoreBand(score) {
  if (score == null || Number.isNaN(Number(score))) return null;
  const value = Number(score);
  if (value >= 80) return MATCH_SCORE_BAND.HIGH;
  if (value >= 65) return MATCH_SCORE_BAND.MID;
  return MATCH_SCORE_BAND.LOW;
}

export function getMatchBarClass(score) {
  const band = getMatchScoreBand(score);
  if (band === MATCH_SCORE_BAND.HIGH) return 'bg-blue-500';
  if (band === MATCH_SCORE_BAND.MID) return 'bg-orange-400';
  if (band === MATCH_SCORE_BAND.LOW) return 'bg-red-500';
  return 'bg-slate-300';
}

export function getEligibilityStatus(row, threshold = DEFAULT_ELIGIBILITY_THRESHOLD) {
  if (row?.overallMatch == null) return EligibilityStatus.PENDING;
  return Number(row.overallMatch) >= Number(threshold)
    ? EligibilityStatus.ELIGIBLE
    : EligibilityStatus.NOT_ELIGIBLE;
}

export function formatEligibilityLabel(status, threshold = DEFAULT_ELIGIBILITY_THRESHOLD) {
  if (status === EligibilityStatus.PENDING) return 'Pending';
  if (status === EligibilityStatus.ELIGIBLE) return 'Eligible';
  return `Below ${threshold}%`;
}

export function isCandidateEligible(row, threshold = DEFAULT_ELIGIBILITY_THRESHOLD) {
  return getEligibilityStatus(row, threshold) === EligibilityStatus.ELIGIBLE;
}

export function isCandidateSelectable(row, threshold = DEFAULT_ELIGIBILITY_THRESHOLD) {
  return isCandidateEligible(row, threshold);
}

export function countEligible(items, threshold = DEFAULT_ELIGIBILITY_THRESHOLD) {
  return (items || []).filter((row) => isCandidateEligible(row, threshold)).length;
}

export function getCandidateInitials(name) {
  if (!name || typeof name !== 'string') return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function formatCandidateSubtitle(row) {
  const title = row?.job?.jobTitle
    || row?.candidate?.extractedProfile?.currentTitle
    || row?.candidate?.extractedProfile?.title
    || 'Candidate';
  const years = row?.candidate?.experienceYears;
  if (years == null || years === '') return title;
  const n = Number(years);
  const label = Number.isFinite(n) ? `${n} yr${n === 1 ? '' : 's'} exp` : `${years} yrs exp`;
  return `${title} · ${label}`;
}

export function hasOutreach(row) {
  return Boolean(row?.outreachRecords?.length);
}

export function hasInterviewInvite(row) {
  return Boolean(row?.interviewInvites?.length);
}

/** Latest non-revoked invite, else latest row. */
export function getLatestInterviewInvite(row) {
  const invites = row?.interviewInvites;
  if (!Array.isArray(invites) || !invites.length) return null;
  const active = invites.find((i) => i.status && i.status !== 'REVOKED');
  return active || invites[0];
}

/**
 * IE-2 T2.8 invite SoT for recruiter labels.
 * Prefer interview_invites over outreach pipeline / schedule alone.
 */
export const InviteDisplayStatus = Object.freeze({
  NONE: 'NONE',
  INVITED: 'INVITED', // SENT
  OPENED: 'OPENED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED', // CONSUMED after successful/exhausted
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED', // REVOKED treated as replaced / not primary
});

const INVITE_LABELS = Object.freeze({
  [InviteDisplayStatus.NONE]: 'No invite',
  [InviteDisplayStatus.INVITED]: 'Invited',
  [InviteDisplayStatus.OPENED]: 'Opened',
  [InviteDisplayStatus.IN_PROGRESS]: 'In progress',
  [InviteDisplayStatus.COMPLETED]: 'Completed',
  [InviteDisplayStatus.EXPIRED]: 'Expired',
  [InviteDisplayStatus.FAILED]: 'Failed',
});

const INVITE_STATUS_MAP = Object.freeze({
  SENT: InviteDisplayStatus.INVITED,
  OPENED: InviteDisplayStatus.OPENED,
  IN_PROGRESS: InviteDisplayStatus.IN_PROGRESS,
  CONSUMED: InviteDisplayStatus.COMPLETED,
  EXPIRED: InviteDisplayStatus.EXPIRED,
  REVOKED: InviteDisplayStatus.FAILED,
});

export function getInviteDisplayStatus(row) {
  const invite = getLatestInterviewInvite(row);
  if (!invite?.status) return InviteDisplayStatus.NONE;
  return INVITE_STATUS_MAP[invite.status] || InviteDisplayStatus.INVITED;
}

export function formatInviteLabel(row) {
  return INVITE_LABELS[getInviteDisplayStatus(row)] || INVITE_LABELS.NONE;
}

/** Candidate-table outreach statuses we surface in UI. */
export const OutreachDisplayStatus = Object.freeze({
  NONE: 'NONE',
  SELECTED: 'SELECTED',
  EMAIL_QUEUED: 'EMAIL_QUEUED',
  EMAIL_SENT: 'EMAIL_SENT',
  SCHEDULED: 'SCHEDULED',
  // IE-2 invite SoT mirrored into outreach cell when invites exist
  INVITED: 'INVITED',
  OPENED: 'OPENED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED',
});

const OUTREACH_LABELS = Object.freeze({
  [OutreachDisplayStatus.NONE]: 'No outreach',
  [OutreachDisplayStatus.SELECTED]: 'Selected',
  [OutreachDisplayStatus.EMAIL_QUEUED]: 'Email queued',
  [OutreachDisplayStatus.EMAIL_SENT]: 'Email sent',
  [OutreachDisplayStatus.SCHEDULED]: 'Scheduled', // booked — not interview result (C3)
  [OutreachDisplayStatus.INVITED]: 'Invited',
  [OutreachDisplayStatus.OPENED]: 'Opened',
  [OutreachDisplayStatus.IN_PROGRESS]: 'In progress',
  [OutreachDisplayStatus.COMPLETED]: 'Completed',
  [OutreachDisplayStatus.EXPIRED]: 'Expired',
  [OutreachDisplayStatus.FAILED]: 'Failed',
});

/** Invite/book SoT only. Do not use for post-call journey status (Decision uses candidate_jobs.status). */
export function getOutreachDisplayStatus(row) {
  // IE-2 T2.8: interview_invites win over outreach pipeline / schedule alone
  if (hasInterviewInvite(row)) {
    const inviteStatus = getInviteDisplayStatus(row);
    if (inviteStatus !== InviteDisplayStatus.NONE) {
      return inviteStatus;
    }
  }
  if (!hasOutreach(row)) return OutreachDisplayStatus.NONE;
  const status = row.outreachRecords[0]?.pipelineStatus;
  if (status === 'EMAIL_SENT') return OutreachDisplayStatus.EMAIL_SENT;
  if (status === 'EMAIL_QUEUED') return OutreachDisplayStatus.EMAIL_QUEUED;
  if (status === 'SELECTED') return OutreachDisplayStatus.SELECTED;
  if (status === 'SCHEDULED') return OutreachDisplayStatus.SCHEDULED;
  // Other pipeline values exist server-side but are not shown as distinct UI here.
  return OutreachDisplayStatus.SELECTED;
}

export function formatOutreachLabel(row) {
  return OUTREACH_LABELS[getOutreachDisplayStatus(row)] || OUTREACH_LABELS.NONE;
}
