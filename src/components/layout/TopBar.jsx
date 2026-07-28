import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { KeyRound, LogOut } from 'lucide-react';
import { logoutUser, selectAuth } from '@/store/slices/authSlice';
import { requestPasswordResetEmailRequest } from '@/api/authApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Roles } from '@/lib/roles';

export function TopBar({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account } = useSelector(selectAuth);
  const [resetBusy, setResetBusy] = useState(false);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out successfully');
    navigate('/login');
  };

  const handleRequestPasswordReset = async () => {
    setResetBusy(true);
    try {
      const { data } = await requestPasswordResetEmailRequest();
      toast.success(data?.message || data?.data?.message || 'Password reset email sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setResetBusy(false);
    }
  };

  const showResetLink = account?.role === Roles.RECRUITER || account?.role === Roles.ADMIN;

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted">
          {account?.firstName} {account?.lastName}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge>{account?.role?.replace('_', ' ')}</Badge>
        {showResetLink && (
          <Button
            variant="outline"
            size="sm"
            disabled={resetBusy}
            onClick={handleRequestPasswordReset}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            {resetBusy ? 'Sending…' : 'Reset password'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
