import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import { logoutUser, selectAuth } from '@/store/slices/authSlice';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export function TopBar({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account } = useSelector(selectAuth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    toast.success('Signed out successfully');
    navigate('/login');
  };

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
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
