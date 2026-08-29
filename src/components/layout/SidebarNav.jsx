import { NavLink } from 'react-router-dom';
import {
  Bot,
  Building2,
  Briefcase,
  ClipboardList,
  CreditCard,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  Settings2,
  UserPlus,
  Users,
  Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Roles } from '@/lib/roles';

const navByRole = {
 [Roles.SUPER_ADMIN]: [
  { to: '/super-admin/registrations', label: 'Pre-registered', icon: UserPlus },
  { to: '/super-admin/organizations', label: 'All organizations', icon: Building2 },
  { to: '/super-admin/manage', label: 'Manage', icon: Settings2 },
  { to: '/super-admin/ai-models', label: 'AI Models', icon: Bot },
  { to: '/super-admin/support', label: 'Support & FAQ', icon: LifeBuoy },
],
  [Roles.ADMIN]: [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/recruiters', label: 'HR Team', icon: Users },
    { to: '/admin/settings', label: 'Organization Settings', icon: Settings2 },
    { to: '/admin/billing', label: 'Billing', icon: CreditCard },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    { to: '/admin/support', label: 'Support', icon: LifeBuoy },
  ],
 [Roles.RECRUITER]: [
  { to: '/recruiter', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/recruiter/jobs', label: 'Jobs', icon: Briefcase },
  { to: '/recruiter/interviews', label: 'Interviews', icon: Video },
  { to: '/recruiter/templates', label: 'Templates', icon: FileText },
  { to: '/recruiter/support', label: 'Support', icon: LifeBuoy },
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
