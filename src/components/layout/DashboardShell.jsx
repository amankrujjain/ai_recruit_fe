import { useSelector } from 'react-redux';
import { selectAuth } from '@/store/slices/authSlice';
import { SidebarNav } from '@/components/layout/SidebarNav';
import { TopBar } from '@/components/layout/TopBar';

export function DashboardShell({ title, children }) {
  const { user } = useSelector(selectAuth);

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card md:block">
        <div className="border-b border-border px-6 py-5">
          <p className="text-lg font-bold text-brand-700">RecruitAI</p>
          <p className="text-xs text-muted">Recruitment Platform</p>
        </div>
        <SidebarNav role={user?.role} />
      </aside>
      <div className="flex flex-1 flex-col">
        <TopBar title={title} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
