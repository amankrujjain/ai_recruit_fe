/**
 * Thin compatibility wrapper — prefer OutreachTab / InterviewsTab / DecisionsTab.
 * Each type mounts a dedicated tab so row state cannot leak across tabs (C5).
 */
import { DecisionsTab } from '@/components/recruiter/jobs/DecisionsTab';
import { InterviewsTab } from '@/components/recruiter/jobs/InterviewsTab';
import { OutreachTab } from '@/components/recruiter/jobs/OutreachTab';

export function JobWorkflowTab({ jobId, type }) {
  if (type === 'outreach') return <OutreachTab jobId={jobId} />;
  if (type === 'interviews') return <InterviewsTab jobId={jobId} />;
  if (type === 'decisions') return <DecisionsTab jobId={jobId} />;
  return null;
}

export { OutreachTab, InterviewsTab, DecisionsTab };
