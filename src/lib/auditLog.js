import {
  Building2,
  CreditCard,
  FileText,
  KeyRound,
  Users,
  Activity,
} from 'lucide-react';

export const ACTION_OPTIONS = [
  { value: 'LOGIN_SUCCESS', label: 'Login Success' },
  { value: 'LOGIN_FAILED', label: 'Login Failed' },
  { value: 'LOGOUT', label: 'Logout' },
  { value: 'INVITATION_SENT', label: 'Invitation Sent' },
  { value: 'INVITATION_ACCEPTED', label: 'Invitation Accepted' },
  { value: 'USER_CREATED', label: 'User Created' },
  { value: 'USER_DISABLED', label: 'User Disabled' },
  { value: 'USER_ENABLED', label: 'User Enabled' },
  { value: 'USER_DELETED', label: 'User Deleted' },
  { value: 'SETTINGS_UPDATED', label: 'Settings Updated' },
  { value: 'ORGANIZATION_CREATED', label: 'Organization Created' },
  { value: 'ORGANIZATION_UPDATED', label: 'Organization Updated' },
  { value: 'ORGANIZATION_DELETED', label: 'Organization Deleted' },
  { value: 'PASSWORD_RESET', label: 'Password Reset' },
  { value: 'PASSWORD_CHANGED', label: 'Password Changed' },
];

export const MODULE_OPTIONS = [
  { value: 'hr_team', label: 'HR Team' },
  { value: 'organization_settings', label: 'Organization Settings' },
  { value: 'templates', label: 'Templates' },
  { value: 'billing', label: 'Billing' },
  { value: 'authentication', label: 'Authentication' },
  { value: 'other', label: 'Other' },
];

export const STATUS_OPTIONS = [
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
];

const ACTION_LABELS = Object.fromEntries(ACTION_OPTIONS.map((o) => [o.value, o.label]));

const MODULE_META = {
  hr_team: { label: 'HR Team', icon: Users },
  organization_settings: { label: 'Organization Settings', icon: Building2 },
  templates: { label: 'Templates', icon: FileText },
  billing: { label: 'Billing', icon: CreditCard },
  authentication: { label: 'Authentication', icon: KeyRound },
  other: { label: 'Other', icon: Activity },
};

export function getActionLabel(action) {
  if (!action) return '—';
  return ACTION_LABELS[action] || action.replace(/_/g, ' ');
}

export function getModuleMeta(moduleKey) {
  return MODULE_META[moduleKey] || MODULE_META.other;
}

export function deriveStatus(log) {
  if (log?.status) return log.status;
  return typeof log?.action === 'string' && log.action.endsWith('_FAILED')
    ? 'failed'
    : 'success';
}

export function formatAuditTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Compose a human-readable details line from action + metadata.
 */
export function composeAuditDetails(log) {
  const action = log?.action || '';
  const meta = (log?.metadata && typeof log.metadata === 'object') ? log.metadata : {};

  switch (action) {
    case 'INVITATION_SENT':
    case 'USER_CREATED':
      if (meta.email) {
        return meta.role
          ? `Invited ${meta.email} as ${String(meta.role).replace(/_/g, ' ')}`
          : `Invited ${meta.email}`;
      }
      break;
    case 'INVITATION_ACCEPTED':
      return meta.email ? `${meta.email} accepted invitation` : 'Invitation accepted';
    case 'USER_DISABLED':
      return meta.email ? `Disabled ${meta.email}` : 'User disabled';
    case 'USER_ENABLED':
      return meta.email ? `Enabled ${meta.email}` : 'User enabled';
    case 'USER_DELETED':
      return meta.email ? `Deleted ${meta.email}` : 'User deleted';
    case 'SETTINGS_UPDATED':
      return 'Organization settings updated';
    case 'ONBOARDING_COMPLETED':
      return 'Onboarding completed';
    case 'LOGIN_SUCCESS':
      return 'Signed in successfully';
    case 'LOGIN_FAILED':
      return meta.reason
        ? `Login failed (${String(meta.reason).replace(/_/g, ' ')})`
        : 'Login failed';
    case 'LOGOUT':
      return 'Signed out';
    case 'PASSWORD_RESET':
      return 'Password reset requested';
    case 'PASSWORD_CHANGED':
      return 'Password changed';
    case 'ORGANIZATION_CREATED':
      return meta.organizationName
        ? `Created organization ${meta.organizationName}`
        : 'Organization created';
    case 'ORGANIZATION_UPDATED':
      return 'Organization updated';
    case 'ORGANIZATION_DELETED':
      return 'Organization deleted';
    default:
      break;
  }

  // updatedFields are shown in the metadata JSON — skip duplicating them here
  const keys = Object.keys(meta).filter(
    (k) => k !== 'updatedFields' && meta[k] != null && meta[k] !== ''
  );
  if (keys.length === 0) return '—';
  return keys
    .slice(0, 3)
    .map((k) => `${k}: ${typeof meta[k] === 'object' ? JSON.stringify(meta[k]) : meta[k]}`)
    .join(' · ');
}

export function toDateInputValue(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** Default filter range: last 7 days inclusive */
export function defaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(end),
  };
}
