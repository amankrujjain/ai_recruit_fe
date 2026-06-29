import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { EmailTemplateCard } from '@/components/admin/templates/EmailTemplateCard';
import { WhatsAppTemplateCard } from '@/components/admin/templates/WhatsAppTemplateCard';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { fetchMyOrganization, selectAdminOrg } from '@/store/slices/adminOrgSlice';

export function AdminTemplatesPage() {
  const dispatch = useDispatch();
  const { organization, loading } = useSelector(selectAdminOrg);
  const [tab, setTab] = useState('email');

  useEffect(() => { dispatch(fetchMyOrganization()); }, [dispatch]);

  return (
    <DashboardShell title="Templates">
      <div className="mx-auto max-w-3xl space-y-6">
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
        {loading && !organization ? (
          <p className="text-sm text-muted">Loading templates...</p>
        ) : tab === 'email' ? (
          <div className="space-y-4">
            {(organization?.emailTemplates || []).map((t) => (
              <EmailTemplateCard key={t.templateId} template={t} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {(organization?.whatsappTemplates || []).map((t) => (
              <WhatsAppTemplateCard key={t.templateId} template={t} />
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
