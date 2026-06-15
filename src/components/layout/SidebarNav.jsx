import { NavLink } from 'react-router-dom';
import { Building2, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Roles } from '@/lib/roles';

const navByRole = {
  [Roles.SUPER_ADMIN]: [
    { to: '/super-admin', label: 'Organizations', icon: Building2, end: true },
  ],
  [Roles.ADMIN]: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ],
  [Roles.RECRUITER]: [
    { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, end: true },
  ],
};

export function SidebarNav({ role }) {
  const items = navByRole[role] || [];

  return (
    <nav className="flex flex-col gap-1 p-4">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
