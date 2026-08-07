import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { CandidateOutreachPage } from '@/pages/candidate/CandidateOutreachPage';
import { CandidateSchedulePage } from '@/pages/candidate/CandidateSchedulePage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Roles } from '@/lib/roles';

const lazyPage = (importer, exportName) =>
  lazy(() => importer().then((m) => ({ default: m[exportName] })));

/* Selected dashboard pages — code-split; auth/candidate stay eager */
const PreRegisteredPage = lazyPage(
  () => import('@/pages/super-admin/PreRegisteredPage'),
  'PreRegisteredPage'
);
const AllOrganizationsPage = lazyPage(
  () => import('@/pages/super-admin/AllOrganizationsPage'),
  'AllOrganizationsPage'
);
const ManageOrganizationPage = lazyPage(
  () => import('@/pages/super-admin/ManageOrganizationPage'),
  'ManageOrganizationPage'
);

const SupportCategoriesPage = lazyPage(
  () => import('@/pages/super-admin/SupportCategoriesPage'),
  'SupportCategoriesPage'
);
const AdminDashboardPage = lazyPage(
  () => import('@/pages/admin/AdminDashboardPage'),
  'AdminDashboardPage'
);
const AdminRecruitersPage = lazyPage(
  () => import('@/pages/admin/AdminRecruitersPage'),
  'AdminRecruitersPage'
);
const AdminSettingsPage = lazyPage(
  () => import('@/pages/admin/AdminSettingsPage'),
  'AdminSettingsPage'
);
const AdminBillingPage = lazyPage(
  () => import('@/pages/admin/AdminBillingPage'),
  'AdminBillingPage'
);
const AdminAuditLogsPage = lazyPage(
  () => import('@/pages/admin/AdminAuditLogsPage'),
  'AdminAuditLogsPage'
);
const RecruiterDashboardPage = lazyPage(
  () => import('@/pages/recruiter/RecruiterDashboardPage'),
  'RecruiterDashboardPage'
);
const RecruiterJobsPage = lazyPage(
  () => import('@/pages/recruiter/RecruiterJobsPage'),
  'RecruiterJobsPage'
);
const RecruiterTemplatesPage = lazyPage(
  () => import('@/pages/recruiter/RecruiterTemplatesPage'),
  'RecruiterTemplatesPage'
);
const JobFormPage = lazyPage(
  () => import('@/pages/recruiter/JobFormPage'),
  'JobFormPage'
);
const JobDetailPage = lazyPage(
  () => import('@/pages/recruiter/JobDetailPage'),
  'JobDetailPage'
);

const SupportCenterPage = lazyPage(
  () => import('@/pages/support/SupportCenterPage'),
  'SupportCenterPage'
);

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/candidate/outreach/:token" element={<CandidateOutreachPage />} />
        <Route path="/candidate/schedule/:token" element={<CandidateSchedulePage />} />
      </Route>

      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/:token" element={<SignUpPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route element={<RoleRoute allowedRoles={[Roles.SUPER_ADMIN]} />}>
  <Route element={<DashboardLayout />}>
    <Route path="/super-admin" element={<Navigate to="/super-admin/registrations" replace />} />

    <Route path="/super-admin/registrations" element={<PreRegisteredPage />} />

    <Route path="/super-admin/organizations" element={<AllOrganizationsPage />} />

    <Route path="/super-admin/manage" element={<ManageOrganizationPage />} />

    <Route path="/super-admin/support" element={<SupportCategoriesPage />} />

  </Route>
</Route>

        <Route element={<RoleRoute allowedRoles={[Roles.ADMIN]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/templates" element={<Navigate to="/admin" replace />} />
            <Route path="/admin/billing" element={<AdminBillingPage />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            <Route path="/admin/support" element={<SupportCenterPage />} />
          </Route>
        </Route>

        <Route element={<RoleRoute allowedRoles={[Roles.RECRUITER]} />}>
          <Route element={<DashboardLayout />}>
            <Route path="/recruiter" element={<RecruiterDashboardPage />} />
            <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
            <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
            <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
            <Route path="/recruiter/jobs/:jobId" element={<JobDetailPage />} />
            <Route path="/recruiter/templates" element={<RecruiterTemplatesPage />} />
            <Route path="/recruiter/support" element={<SupportCenterPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
