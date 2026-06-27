import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { resetPasswordRequest } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { PasswordField } from '@/components/auth/PasswordField';
import { PasswordStrengthRules } from '@/components/auth/PasswordStrengthRules';
import { isPasswordValid, validatePassword, validatePasswordMatch } from '@/lib/passwordRules';

export function ResetPasswordForm({ token, resetInfo }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const canSubmit = isPasswordValid(password) && password === confirm && confirm.length > 0;

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
      const { data } = await resetPasswordRequest(token, password);
      toast.success(data.message || 'Password reset successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4 text-sm">
        <p className="font-medium text-foreground">
          Reset password for {resetInfo?.firstName ? `${resetInfo.firstName} ` : ''}
          <span className="text-brand-700">{resetInfo?.email}</span>
        </p>
      </div>
      <PasswordField
        id="new-password"
        label="New password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
        }}
        error={errors.password}
        placeholder="Create a strong password"
      />
      <PasswordStrengthRules password={password} />
      <PasswordField
        id="confirm-password"
        label="Confirm password"
        value={confirm}
        onChange={(e) => {
          setConfirm(e.target.value);
          if (errors.confirm) setErrors((prev) => ({ ...prev, confirm: null }));
        }}
        error={errors.confirm}
        placeholder="Re-enter your password"
      />
      <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
        {loading ? 'Resetting...' : 'Reset password'}
      </Button>
    </form>
  );
}
