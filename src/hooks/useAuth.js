import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, setInitialized, selectAuth } from '@/store/slices/authSlice';
import { refreshSession } from '@/api/client';

/**
 * Bootstrap session from httpOnly cookies:
 * 1. /auth/me (access cookie)
 * 2. on failure, refresh once then /auth/me again
 */
export function useAuthInit() {
  const dispatch = useDispatch();

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const result = await dispatch(fetchProfile());
        if (fetchProfile.fulfilled.match(result)) {
          if (!cancelled) dispatch(setInitialized());
          return;
        }
        await refreshSession();
        await dispatch(fetchProfile());
      } catch {
        // unauthenticated — cookies missing/expired
      } finally {
        if (!cancelled) dispatch(setInitialized());
      }
    };

    init();
    return () => { cancelled = true; };
  }, [dispatch]);
}

export function useAuth() {
  return useSelector(selectAuth);
}
