import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { BrandLogo, AuthFooterLink } from '@/components/auth/AuthBranding';

export function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <BrandLogo subtitle="Account recovery" />
        <h2 className="mt-6 text-2xl font-bold">Forgot your password?</h2>
        <p className="text-sm text-muted">
          Enter your work email and we&apos;ll send you a link to reset your password.
        </p>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
        <div className="mt-6">
          <AuthFooterLink text="Remember your password?" linkText="Sign in" to="/login" />
        </div>
      </CardContent>
    </Card>
  );
}
