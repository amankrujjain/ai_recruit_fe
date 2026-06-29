import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { updateEmailTemplate } from '@/store/slices/adminOrgSlice';

export function EmailTemplateCard({ template }) {
  const dispatch = useDispatch();
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const result = await dispatch(updateEmailTemplate({
      templateId: template.templateId,
      payload: { subject, body },
    }));
    setSaving(false);
    if (updateEmailTemplate.fulfilled.match(result)) toast.success('Template saved');
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
          <Label>Subject</Label>
          <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Body</Label>
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
