import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignUpPage } from '@/pages/auth/SignUpPage';
import { SuperAdminOrganizationsPage } from '@/pages/super-admin/SuperAdminOrganizationsPage';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { RecruiterDashboardPage } from '@/pages/recruiter/RecruiterDashboardPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { PublicRoute } from '@/routes/PublicRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { DashboardRedirect } from '@/routes/DashboardRedirect';
import { Roles } from '@/lib/roles';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup/:token" element={<SignUpPage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardRedirect />} />

        <Route element={<RoleRoute allowedRoles={[Roles.SUPER_ADMIN]} />}>
          <Route path="/super-admin" element={<SuperAdminOrganizationsPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[Roles.ADMIN]} />}>
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Route>

        <Route element={<RoleRoute allowedRoles={[Roles.RECRUITER]} />}>
          <Route path="/recruiter" element={<RecruiterDashboardPage />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
