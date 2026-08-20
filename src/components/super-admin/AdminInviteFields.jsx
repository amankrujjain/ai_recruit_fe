import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

export function AdminInviteFields({ form, onChange }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="adminFirstName">POC first name</Label>
        <Input
          id="adminFirstName"
          value={form.adminFirstName}
          onChange={onChange('adminFirstName')}
          placeholder="Jane"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="adminLastName">POC last name</Label>
        <Input
          id="adminLastName"
          value={form.adminLastName}
          onChange={onChange('adminLastName')}
          placeholder="Smith"
          required
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="adminEmail">Organization email</Label>
        <Input
          id="adminEmail"
          type="email"
          value={form.adminEmail}
          onChange={onChange('adminEmail')}
          placeholder="hr@company.com"
          required
        />
      </div>
    </div>
  );
}
