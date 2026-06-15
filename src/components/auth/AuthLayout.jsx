import { Outlet } from 'react-router-dom';
import { BrandLogo } from './AuthBranding';
import { AuthHeroPanel } from './AuthHeroPanel';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-surface to-teal-50 p-4 md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-8 lg:grid-cols-2">
        <AuthHeroPanel />
        <div className="flex flex-col justify-center">
          <div className="mb-8 lg:hidden">
            <BrandLogo subtitle="AI Recruitment Platform" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
