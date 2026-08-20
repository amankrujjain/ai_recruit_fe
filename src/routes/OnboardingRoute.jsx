import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { Roles } from '@/lib/roles';

/** Tenant users must finish org onboarding before using the dashboard. */
export function RequireOnboardingComplete() {
  const { account } = useSelector(selectAuth);
  const incomplete = account?.organizationId && account?.onboardingCompleted === false;

  if (!incomplete) {
    return <Outlet />;
  }

  if (account?.role === Roles.ADMIN) {
    return <Navigate to="/admin/onboarding" replace />;
  }

  return <Navigate to="/setup-pending" replace />;
}

/** Onboarding / pending pages: bounce away once complete. */
export function RequireOnboardingPending() {
  const { account } = useSelector(selectAuth);
  const incomplete = account?.organizationId && account?.onboardingCompleted === false;

  if (incomplete) {
    return <Outlet />;
  }

  if (account?.role === Roles.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  if (account?.role === Roles.RECRUITER) {
    return <Navigate to="/recruiter" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
