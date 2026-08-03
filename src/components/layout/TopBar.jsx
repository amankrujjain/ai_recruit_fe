import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, ChevronDown, KeyRound, LogOut } from 'lucide-react';
import { logoutUser, selectAuth } from '@/store/slices/authSlice';
import { selectAdminOrg } from '@/store/slices/adminOrgSlice';
import { requestPasswordResetEmailRequest } from '@/api/authApi';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/utils';
import { Roles, getRoleLabel } from '@/lib/roles';
import { resolveAssetUrl } from '@/lib/assetUrl';

function getInitials(account) {
  const first = account?.firstName?.[0] || '';
  const last = account?.lastName?.[0] || '';
  return (first + last).toUpperCase() || 'U';
}

function HeaderAvatar({ account, logoUrl }) {
  const logoSrc = resolveAssetUrl(logoUrl);

  if (logoSrc) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
        <img
          key={logoSrc}
          src={logoSrc}
          alt="Organization logo"
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
      {getInitials(account)}
    </span>
  );
}

export function TopBar({ title }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { account } = useSelector(selectAuth);
  const { organization } = useSelector(selectAdminOrg);
  const [resetBusy, setResetBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      setMenuOpen(false);
    }
  };

  const showResetLink = account?.role === Roles.RECRUITER || account?.role === Roles.ADMIN;
  const roleLabel = getRoleLabel(account?.role);

  return (
    <header className="flex items-center justify-between gap-4 border-b border-border bg-card px-6 py-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted">
          Welcome back, {account?.firstName || 'there'} {account?.lastName || ''} 👋
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <SearchInput value={search} onChange={setSearch} placeholder="Search anything..." />
        </div>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-600 ring-2 ring-card" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface"
          >
            <HeaderAvatar account={account} logoUrl={organization?.logoUrl} />
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-semibold leading-tight text-foreground">
                {account?.firstName} {account?.lastName}
              </span>
              <span className="block text-xs leading-tight text-muted">{roleLabel}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-muted" />
          </button>

          <div
            className={cn(
              'absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-xl shadow-brand-600/10',
              menuOpen ? 'block' : 'hidden'
            )}
          >
            {showResetLink && (
              <button
                type="button"
                disabled={resetBusy}
                onClick={handleRequestPasswordReset}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-brand-50 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                {resetBusy ? 'Sending…' : 'Reset password'}
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-brand-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
