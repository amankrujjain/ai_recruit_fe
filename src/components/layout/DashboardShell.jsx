import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Building2, ChevronDown, Crown, Zap } from 'lucide-react';
import { selectAuth } from '@/store/slices/authSlice';
import { fetchMyOrganization, fetchBilling, selectAdminOrg } from '@/store/slices/adminOrgSlice';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopBar } from '@/components/layout/TopBar';
import { usePageTitleState } from '@/context/PageTitleContext';
import { Roles } from '@/lib/roles';

function PlanCard({ planName, renewalDate }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <Crown className="h-5 w-5 text-amber-500" fill="currentColor" strokeWidth={1.5} />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-xs text-muted">You are on</p>
          <p className="mt-0.5 text-sm font-bold leading-snug text-foreground">
            {planName || 'Free Plan'}
          </p>
        </div>
      </div>
      {renewalDate && (
        <p className="mt-3 text-xs text-muted">
          Renews on{' '}
          {new Date(renewalDate).toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </p>
      )}
      <Link
        to="/admin/billing"
        className="mt-4 flex w-full items-center justify-center rounded-xl border border-brand-500 px-3 py-2.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-50"
      >
        View Plan Details
      </Link>
    </div>
  );
}

export function DashboardShell({ children }) {
  const dispatch = useDispatch();
  const { account } = useSelector(selectAuth);
  const { organization, billing } = useSelector(selectAdminOrg);
  const { title } = usePageTitleState();
  const isAdmin = account?.role === Roles.ADMIN;

  useEffect(() => {
    if (isAdmin) {
      dispatch(fetchMyOrganization());
      dispatch(fetchBilling());
    }
  }, [dispatch, isAdmin]);

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-surface">
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex shrink-0 items-center gap-2.5 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-md shadow-brand-600/30">
            <Zap className="h-5 w-5" />
          </span>
          <p className="text-lg font-bold text-brand-700">RecruitAI</p>
        </div>

        {isAdmin && (
          <div className="shrink-0 px-4 pb-2">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-brand-50"
            >
              <Building2 className="h-4 w-4 shrink-0 text-brand-500" />
              <span className="min-w-0 flex-1 truncate">
                {organization?.organizationName || 'Your organization'}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <SidebarNav role={account?.role} />
        </div>

        {isAdmin && (
          <div className="shrink-0 border-t border-border p-4">
            <PlanCard
              planName={billing?.currentPlan?.planName}
              renewalDate={billing?.currentPlan?.renewalDate}
            />
          </div>
        )}
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="shrink-0">
          <TopBar title={title} />
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
