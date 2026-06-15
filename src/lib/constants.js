const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const storageKeys = {
  accessToken: 'recruit_access_token',
  refreshToken: 'recruit_refresh_token',
  user: 'recruit_user',
};

export { API_BASE };
