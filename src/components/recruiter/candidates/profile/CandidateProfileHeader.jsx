import { Link } from 'react-router-dom';
import { FileText, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  formatCandidateSubtitle,
  formatOutreachLabel,
  getOutreachDisplayStatus,
  OutreachDisplayStatus,
} from '@/lib/candidateEligibility';

function formatBooked(schedule) {
  if (!schedule?.scheduledAt) return null;
  return new Date(schedule.scheduledAt).toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CandidateProfileHeader({ candidateJob, job }) {
  const candidate = candidateJob?.candidate || {};
  const name = candidate.name || 'Candidate';
  const subtitle = formatCandidateSubtitle(candidateJob);
  const location =
    candidate.extractedProfile?.location
    || (Array.isArray(job?.location) ? job.location.filter(Boolean).join(', ') : job?.location)
    || null;
  const outreachStatus = getOutreachDisplayStatus(candidateJob);
  const outreachLabel = formatOutreachLabel(candidateJob);
  const bookedLabel = formatBooked(candidateJob?.callSchedules?.[0]);
  const resumeUrl = candidate.resumeUrl;
  const showOutreachBadge = outreachStatus !== OutreachDisplayStatus.NONE;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold text-foreground">{name}</h2>
        <p className="mt-1 text-sm text-muted">
          {subtitle}
          {location ? ` · ${location}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {showOutreachBadge ? (
            <Badge variant="success" className="gap-1.5 px-2.5 py-1 text-sm font-medium">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
              {outreachLabel}
            </Badge>
          ) : (
            <span className="text-sm text-muted">No outreach</span>
          )}
          {bookedLabel ? (
            <span className="text-sm text-muted">Booked {bookedLabel}</span>
          ) : null}
        </div>
      </div>
      {resumeUrl ? (
        <Button variant="outline" size="sm" asChild>
          <a href={resumeUrl} target="_blank" rel="noreferrer">
            <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            View résumé
          </a>
        </Button>
      ) : (
        <Button variant="outline" size="sm" disabled>
          <FileText className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          View résumé
        </Button>
      )}
    </div>
  );
}

export function CandidateProfileBreadcrumb({ job, candidateName }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
      <Link to="/recruiter/jobs" className="hover:text-foreground">
        Jobs
      </Link>
      <span aria-hidden className="text-slate-300">/</span>
      <Link
        to={`/recruiter/jobs/${job?.jobId}?tab=candidates`}
        className="truncate hover:text-foreground"
      >
        {job?.jobTitle || 'Job'}
      </Link>
      <span aria-hidden className="text-slate-300">/</span>
      <Link
        to={`/recruiter/jobs/${job?.jobId}?tab=candidates`}
        className="hover:text-foreground"
      >
        Candidates
      </Link>
      <span aria-hidden className="text-slate-300">/</span>
      <span className="truncate text-foreground">{candidateName}</span>
    </nav>
  );
}
