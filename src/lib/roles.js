export const Roles = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  RECRUITER: 'RECRUITER',
};

export const getDashboardPath = (role) => {
  const paths = {
    [Roles.SUPER_ADMIN]: '/super-admin/registrations',
    [Roles.ADMIN]: '/admin',
    [Roles.RECRUITER]: '/recruiter',
  };
  return paths[role] || '/login';
};

export const isRole = (user, role) => user?.role === role;
