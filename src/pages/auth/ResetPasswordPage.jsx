import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { validateResetTokenRequest } from '@/api/authApi';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BrandLogo, AuthFooterLink } from '@/components/auth/AuthBranding';
import { Loader2 } from 'lucide-react';

export function ResetPasswordPage() {
  const { token } = useParams();
  const [resetInfo, setResetInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const { data } = await validateResetTokenRequest(token);
        setResetInfo(data.data);
      } catch (err) {
        setInvalid(true);
        toast.error(err.response?.data?.message || 'Invalid or expired reset link');
      } finally {
        setLoading(false);
      }
    };
    if (token) validate();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (invalid) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-lg font-semibold text-foreground">Reset link expired or invalid</p>
          <p className="mt-2 text-sm text-muted">Request a new password reset link to continue.</p>
          <Link to="/forgot-password" className="mt-6 inline-block font-semibold text-brand-600">
            Request new link
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <BrandLogo subtitle="Account recovery" />
        <h2 className="mt-6 text-2xl font-bold">Set a new password</h2>
        <p className="text-sm text-muted">Choose a strong password for your account.</p>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token} resetInfo={resetInfo} />
        <div className="mt-6">
          <AuthFooterLink text="Back to" linkText="Sign in" to="/login" />
        </div>
      </CardContent>
    </Card>
  );
}
