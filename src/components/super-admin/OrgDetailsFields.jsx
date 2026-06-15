import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';

export function OrgDetailsFields({ form, onChange, countries, countriesLoading }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization name</Label>
        <Input
          id="organizationName"
          value={form.organizationName}
          onChange={onChange('organizationName')}
          placeholder="Acme Recruiting Ltd"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="countryId">Country</Label>
          <Select
            id="countryId"
            value={form.countryId}
            onChange={onChange('countryId')}
            required
            disabled={countriesLoading}
          >
            <option value="">Select country</option>
            {countries.map((c) => (
              <option key={c.countryId} value={c.countryId}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City (optional)</Label>
          <Input
            id="city"
            value={form.city}
            onChange={onChange('city')}
            placeholder="London"
          />
        </div>
      </div>
    </>
  );
}
