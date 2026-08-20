import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { getDashboardPath } from '@/lib/roles';

export function RoleRoute({ allowedRoles }) {
  const { account } = useSelector(selectAuth);
  const role = account?.role;

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role, account)} replace />;
  }

  return <Outlet />;
}
