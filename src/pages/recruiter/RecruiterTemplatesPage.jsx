import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { usePageTitle } from '@/context/PageTitleContext';
import { EmailTemplateCard } from '@/components/admin/templates/EmailTemplateCard';
import { WhatsAppTemplateCard } from '@/components/admin/templates/WhatsAppTemplateCard';
import { Button } from '@/components/ui/Button';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { cn } from '@/lib/utils';
import { fetchMyOrganization, selectAdminOrg } from '@/store/slices/adminOrgSlice';

/** Recruiter (HR) templates — same org email/WhatsApp templates. */
export function RecruiterTemplatesPage() {
  usePageTitle('Templates');
  const dispatch = useDispatch();
  const { organization, loading } = useSelector(selectAdminOrg);
  const [tab, setTab] = useState('email');

  useEffect(() => { dispatch(fetchMyOrganization()); }, [dispatch]);

  if (loading && !organization) {
    return <PageContentSkeleton />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <p className="text-sm text-muted">
        Edit outreach email and WhatsApp templates used when contacting candidates.
      </p>
      <div className="flex gap-2">
        {['email', 'whatsapp'].map((t) => (
          <Button
            key={t}
            variant={tab === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab(t)}
            className={cn('capitalize')}
          >
            {t === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </Button>
        ))}
      </div>
      {tab === 'email' ? (
        <div className="space-y-4">
          {(organization?.emailTemplates || []).map((t) => (
            <EmailTemplateCard key={t.templateId} template={t} />
          ))}
          {!organization?.emailTemplates?.length && (
            <p className="text-sm text-muted">No email templates found for this organization.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {(organization?.whatsappTemplates || []).map((t) => (
            <WhatsAppTemplateCard key={t.templateId} template={t} />
          ))}
          {!organization?.whatsappTemplates?.length && (
            <p className="text-sm text-muted">No WhatsApp templates found for this organization.</p>
          )}
        </div>
      )}
    </div>
  );
}
