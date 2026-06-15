import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { getDashboardPath } from '@/lib/roles';

export function RoleRoute({ allowedRoles }) {
  const { user } = useSelector(selectAuth);
  const role = user?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <Outlet />;
}
