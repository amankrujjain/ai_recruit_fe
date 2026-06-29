import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { PreRegisteredPage } from '@/pages/super-admin/PreRegisteredPage';
import { AllOrganizationsPage } from '@/pages/super-admin/AllOrganizationsPage';
import { ManageOrganizationPage } from '@/pages/super-admin/ManageOrganizationPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { AdminRecruitersPage } from '@/pages/admin/AdminRecruitersPage';
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage';
import { AdminTemplatesPage } from '@/pages/admin/AdminTemplatesPage';
import { AdminBillingPage } from '@/pages/admin/AdminBillingPage';
import { AdminAuditLogsPage } from '@/pages/admin/AdminAuditLogsPage';
import { RecruiterDashboardPage } from '@/pages/recruiter/RecruiterDashboardPage';
import { RecruiterJobsPage } from '@/pages/recruiter/RecruiterJobsPage';
import { JobFormPage } from '@/pages/recruiter/JobFormPage';
import { JobDetailPage } from '@/pages/recruiter/JobDetailPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import { Roles } from '@/lib/roles';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
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
          <Route path="/super-admin" element={<Navigate to="/super-admin/registrations" replace />} />
          <Route path="/super-admin/registrations" element={<PreRegisteredPage />} />
          <Route path="/super-admin/organizations" element={<AllOrganizationsPage />} />
          <Route path="/super-admin/manage" element={<ManageOrganizationPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[Roles.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/recruiters" element={<AdminRecruitersPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          <Route path="/admin/templates" element={<AdminTemplatesPage />} />
          <Route path="/admin/billing" element={<AdminBillingPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[Roles.RECRUITER]} />}>
          <Route path="/recruiter" element={<RecruiterDashboardPage />} />
          <Route path="/recruiter/jobs" element={<RecruiterJobsPage />} />
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/:jobId/edit" element={<JobFormPage />} />
          <Route path="/recruiter/jobs/:jobId" element={<JobDetailPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
