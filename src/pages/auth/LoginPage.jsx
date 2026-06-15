import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BrandLogo } from '@/components/auth/AuthBranding';

export function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <BrandLogo subtitle="Welcome back" />
        <h2 className="mt-6 text-2xl font-bold">Sign in to your account</h2>
        <p className="text-sm text-muted">Access your recruitment dashboard and campaigns.</p>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted">
          Activate your account using the invitation link sent to your email.
        </p>
      </CardContent>
    </Card>
  );
}
