import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { inviteRecruiter, selectRecruiters } from '@/store/slices/recruitersSlice';

const empty = { firstName: '', lastName: '', email: '' };

export function InviteRecruiterForm({ onInvited }) {
  const dispatch = useDispatch();
  const { inviting } = useSelector(selectRecruiters);
  const [form, setForm] = useState(empty);
  const onChange = (f) => (e) => setForm((s) => ({ ...s, [f]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(inviteRecruiter(form));
    if (inviteRecruiter.fulfilled.match(result)) {
      toast.success('Invitation sent to recruiter');
      setForm(empty);
      onInvited?.();
    } else {
      toast.error(result.payload || 'Failed to invite recruiter');
    }
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Invite recruiter</h3>
        <p className="text-sm text-muted">They will receive an email to set up their account.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="r-first">First name</Label>
            <Input id="r-first" value={form.firstName} onChange={onChange('firstName')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-last">Last name</Label>
            <Input id="r-last" value={form.lastName} onChange={onChange('lastName')} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="r-email">Email</Label>
            <Input id="r-email" type="email" value={form.email} onChange={onChange('email')} required />
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={inviting}>
              {inviting ? 'Sending...' : 'Send invitation'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
