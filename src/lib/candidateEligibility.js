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

/** Candidate-table outreach statuses we surface in UI. */
export const OutreachDisplayStatus = Object.freeze({
  NONE: 'NONE',
  SELECTED: 'SELECTED',
  EMAIL_QUEUED: 'EMAIL_QUEUED',
  EMAIL_SENT: 'EMAIL_SENT',
  SCHEDULED: 'SCHEDULED',
});

const OUTREACH_LABELS = Object.freeze({
  [OutreachDisplayStatus.NONE]: 'No outreach',
  [OutreachDisplayStatus.SELECTED]: 'Selected',
  [OutreachDisplayStatus.EMAIL_QUEUED]: 'Email queued',
  [OutreachDisplayStatus.EMAIL_SENT]: 'Email sent',
  [OutreachDisplayStatus.SCHEDULED]: 'Scheduled',
});

export function getOutreachDisplayStatus(row) {
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
