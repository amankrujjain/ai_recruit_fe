import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export function BrandLogo({ subtitle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-accent-500 shadow-lg">
        <Sparkles className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="text-lg font-bold text-foreground">RecruitAI</p>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, to }) {
  return (
    <p className="text-center text-sm text-muted">
      {text}{' '}
      <Link to={to} className="font-semibold text-brand-600 hover:text-brand-700">
        {linkText}
      </Link>
    </p>
  );
}
