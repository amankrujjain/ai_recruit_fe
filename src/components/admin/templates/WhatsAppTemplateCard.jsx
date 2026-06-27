import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { updateWhatsAppTemplate } from '@/store/slices/adminOrgSlice';

export function WhatsAppTemplateCard({ template }) {
  const dispatch = useDispatch();
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await dispatch(updateWhatsAppTemplate({
      templateId: template.templateId,
      payload: { body },
    }));
    setSaving(false);
    if (updateWhatsAppTemplate.fulfilled.match(result)) toast.success('Template saved');
    else toast.error(result.payload || 'Failed to save');
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold capitalize">{template.name.replace(/_/g, ' ')}</h3>
        <p className="text-xs text-muted">Variables: {'{{candidate_name}}'}, {'{{job_title}}'}, {'{{organization_name}}'}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Message body</Label>
          <textarea
            className="min-h-32 w-full rounded-lg border border-border bg-card p-3 text-sm"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save template'}
        </Button>
      </CardContent>
    </Card>
  );
}
