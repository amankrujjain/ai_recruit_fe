const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

/** Account cache only — JWTs live in httpOnly cookies (recruit_at / recruit_rt). */
export const storageKeys = {
  account: 'recruit_account',
  /** @deprecated use account */
  user: 'recruit_user',
};

export { API_BASE };
