import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { getDashboardPath } from '@/lib/roles';

export function DashboardRedirect() {
  const { account } = useSelector(selectAuth);
  return <Navigate to={getDashboardPath(account?.role, account)} replace />;
}
