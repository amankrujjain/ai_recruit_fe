import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { validateInviteRequest } from '@/api/authApi';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BrandLogo, AuthFooterLink } from '@/components/auth/AuthBranding';
import { Roles } from '@/lib/roles';
import { Loader2 } from 'lucide-react';

const pageCopy = {
  [Roles.ADMIN]: {
    title: 'Activate your organization',
    subtitle: 'Create a secure password to access your admin dashboard.',
  },
  default: {
    title: 'Create your password',
    subtitle: 'Set a secure password to activate your account.',
  },
};

export function SignUpPage() {
  const { token } = useParams();
  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    const validate = async () => {
      try {
        const { data } = await validateInviteRequest(token);
        setInviteInfo(data.data);
      } catch (err) {
        setInvalid(true);
        toast.error(err.response?.data?.message || 'Invalid invitation link');
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
          <p className="text-lg font-semibold text-foreground">Invitation expired or invalid</p>
          <p className="mt-2 text-sm text-muted">Contact your administrator for a new invite.</p>
          <Link to="/login" className="mt-6 inline-block text-brand-600 font-semibold">Back to sign in</Link>
        </CardContent>
      </Card>
    );
  }

  const copy = pageCopy[inviteInfo?.role] || pageCopy.default;

  return (
    <Card>
      <CardHeader>
        <BrandLogo subtitle="Complete your account setup" />
        <h2 className="mt-6 text-2xl font-bold">{copy.title}</h2>
        <p className="text-sm text-muted">{copy.subtitle}</p>
      </CardHeader>
      <CardContent>
        <SignUpForm token={token} inviteInfo={inviteInfo} />
        <div className="mt-6">
          <AuthFooterLink text="Already activated?" linkText="Sign in" to="/login" />
        </div>
      </CardContent>
    </Card>
  );
}
