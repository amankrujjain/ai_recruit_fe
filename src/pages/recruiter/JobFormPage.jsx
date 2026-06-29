import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { JobForm } from '@/components/recruiter/jobs/JobForm';
import {
  createJob,
  fetchJob,
  updateJob,
  selectJobs,
  clearCurrentJob,
} from '@/store/slices/jobsSlice';

export function JobFormPage() {
  const { jobId } = useParams();
  const isEdit = Boolean(jobId);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { current, detailLoading, saving } = useSelector(selectJobs);

  useEffect(() => {
    if (isEdit) dispatch(fetchJob(jobId));
    return () => dispatch(clearCurrentJob());
  }, [dispatch, isEdit, jobId]);

  const handleSubmit = async (payload) => {
    const result = isEdit
      ? await dispatch(updateJob({ jobId, payload }))
      : await dispatch(createJob(payload));

    if (createJob.fulfilled.match(result) || updateJob.fulfilled.match(result)) {
      toast.success(isEdit ? 'Job updated' : 'Job created');
      navigate(`/recruiter/jobs/${result.payload.jobId}`);
    } else {
      toast.error(result.payload || 'Save failed');
    }
  };

  if (isEdit && detailLoading && !current) {
    return (
      <DashboardShell title="Edit job">
        <p className="text-sm text-muted">Loading job…</p>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title={isEdit ? 'Edit job' : 'Create job'}>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={isEdit ? 'Edit job posting' : 'New job posting'}
          subtitle={isEdit ? 'Update role details and requirements.' : 'Define the role you are hiring for.'}
        />
        <Card>
          <CardContent className="pt-6">
            <JobForm
              initial={isEdit ? current : null}
              saving={saving}
              onSubmit={handleSubmit}
              onCancel={() => navigate(isEdit ? `/recruiter/jobs/${jobId}` : '/recruiter/jobs')}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
