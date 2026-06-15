import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute() {
  const isAuth = useSelector(selectIsAuthenticated);
  const { initialized } = useSelector((s) => s.auth);

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!isAuth) return <Navigate to="/login" replace />;
  return <Outlet />;
}
