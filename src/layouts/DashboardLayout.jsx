import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { PageContentSkeleton } from '@/components/layout/PageContentSkeleton';
import { PageTitleProvider } from '@/context/PageTitleContext';

/**
 * Shared app shell for admin / recruiter / super-admin.
 * Sidebar stays mounted across navigations; pages are lazy + Suspense.
 */
export function DashboardLayout() {
  const location = useLocation();

  return (
    <PageTitleProvider>
      <DashboardShell>
        {/* key remounts the boundary per route so Suspense can show again if needed */}
        <Suspense fallback={<PageContentSkeleton />} key={location.pathname}>
          <Outlet />
        </Suspense>
      </DashboardShell>
    </PageTitleProvider>
  );
}
