import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '@/store/slices/authSlice';

export function PublicRoute() {
  const isAuth = useSelector(selectIsAuthenticated);
  const { initialized } = useSelector((s) => s.auth);

  if (!initialized) return null;
  if (isAuth) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
