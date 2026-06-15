import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { acceptInviteRequest } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/auth/PasswordField';
import { InviteWelcomeBanner } from '@/components/auth/InviteWelcomeBanner';
import { validatePassword, validatePasswordMatch } from '@/lib/passwordRules';

export function SignUpForm({ token, inviteInfo }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const pwErr = validatePassword(password);
    const matchErr = validatePasswordMatch(password, confirm);
    if (pwErr || matchErr) {
      setErrors({ password: pwErr, confirm: matchErr });
      return;
    }

    setLoading(true);
    try {
      const { data } = await acceptInviteRequest(token, password);
      toast.success(data.message || 'Account activated! You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to activate account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <InviteWelcomeBanner inviteInfo={inviteInfo} />
      <PasswordField
        id="password"
        label="Create password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        placeholder="Min 8 chars with mixed case & symbol"
      />
      <PasswordField
        id="confirm"
        label="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirm}
        placeholder="Re-enter your password"
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Activating...' : 'Activate account'}
      </Button>
    </form>
  );
}
