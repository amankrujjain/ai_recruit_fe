import { Roles } from '@/lib/roles';

const getWelcomeMessage = ({ firstName, organizationName, role }) => {
  if (role === Roles.ADMIN) {
    return `Hi ${firstName}, your organization ${organizationName} is onboarded on AI Recruiter.`;
  }

  return `Hi ${firstName}, you've been invited to join ${organizationName} as a recruiter on AI Recruiter.`;
};

export function InviteWelcomeBanner({ inviteInfo }) {
  if (!inviteInfo) return null;

  return (
    <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-700">
      <p className="font-medium leading-relaxed">
        {getWelcomeMessage(inviteInfo)}
      </p>
      <p className="mt-2 text-brand-600">
        Set your password below to activate your account.
      </p>
    </div>
  );
}
