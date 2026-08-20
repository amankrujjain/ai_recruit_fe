import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { logoutUser, selectAuth } from '@/store/slices/authSlice';

export function SetupPendingPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account } = useSelector(selectAuth);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Zap className="h-5 w-5" />
          </span>
          <p className="text-lg font-bold text-brand-700">RecruitAI</p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <Card className="max-w-md border-slate-200 shadow-sm">
          <CardContent className="space-y-3 p-6 text-center">
            <h1 className="text-xl font-semibold text-slate-900">Setup in progress</h1>
            <p className="text-sm text-slate-500">
              Hi {account?.firstName || 'there'} — your organization admin still needs to finish
              onboarding. You can log out and try again once that is complete.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
