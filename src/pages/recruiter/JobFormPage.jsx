import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { usePageTitle } from '@/context/PageTitleContext';
import { JobForm } from '@/components/recruiter/jobs/JobForm';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
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
  usePageTitle(isEdit ? 'Edit job' : 'Create job');
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
    return <PageContentSkeleton />;
  }

  return (
    <JobForm
      initial={isEdit ? current : null}
      saving={saving}
      onSubmit={handleSubmit}
      onCancel={() => navigate(isEdit ? `/recruiter/jobs/${jobId}` : '/recruiter/jobs')}
    />
  );
}
