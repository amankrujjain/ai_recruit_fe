import { useState } from 'react';
import { toast } from 'sonner';
import { forgotPasswordRequest } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await forgotPasswordRequest(email);
      const sentEmail = data?.data?.email || email;
      setSentTo(sentEmail);
      toast.success(data?.message || data?.data?.message || 'Password reset link sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sentTo) {
    return (
      <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm text-foreground">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-muted">
          We verified your account and sent a password reset link to{' '}
          <span className="font-medium text-foreground">{sentTo}</span>.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Work email</Label>
        <Input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
        <p className="text-xs text-muted">
          We verify the email belongs to an active account before sending the link.
        </p>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Verifying…' : 'Send reset link'}
      </Button>
    </form>
  );
}
