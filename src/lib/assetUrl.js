import { API_BASE } from '@/lib/constants';

/** Resolve logo / upload paths for display (absolute URL or /uploads/... from API host). */
export function resolveAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const origin = API_BASE.replace(/\/api\/v1\/?$/, '') || 'http://localhost:3000';
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${origin}${path}`;
}
