export const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  RECRUITER: 'RECRUITER',
};

/** Human-readable labels for system roles (not job designation). */
export const roleLabels = {
  [Roles.SUPER_ADMIN]: 'Super Admin',
  [Roles.ADMIN]: 'Organization Admin',
  [Roles.RECRUITER]: 'Recruiter',
};

/**
 * @param {string|{ name?: string }|null|undefined} role - Role enum string or API `{ name }`
 */
export const getRoleLabel = (role) => {
  const name = typeof role === 'string' ? role : role?.name;
  if (!name) return null;
  return roleLabels[name] || String(name).replaceAll('_', ' ');
};

export const getDashboardPath = (role, account) => {
  if (
    account?.organizationId &&
    account?.onboardingCompleted === false
  ) {
    if (role === Roles.ADMIN) return '/admin/onboarding';
    if (role === Roles.RECRUITER) return '/setup-pending';
  }

  const paths = {
    [Roles.SUPER_ADMIN]: '/super-admin/registrations',
    [Roles.ADMIN]: '/admin',
    [Roles.RECRUITER]: '/recruiter',
  };
  return paths[role] || '/login';
};

export const isRole = (account, role) => account?.role === role;
