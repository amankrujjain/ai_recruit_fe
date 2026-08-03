import { API_BASE } from '@/lib/constants';

/**
 * Resolve logo / asset paths for <img src>.
 * - Absolute http(s) URLs (Cloudinary) pass through unchanged
 * - Legacy relative /uploads/... paths resolve against the API host during transition
 */
export function resolveAssetUrl(pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const assetPath = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;

  if (!/^https?:\/\//i.test(API_BASE)) {
    return `http://localhost:3000${assetPath}`;
  }

  const origin = API_BASE.replace(/\/api\/v1\/?$/, '');
  return `${origin}${assetPath}`;
}
