import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchProfile, setInitialized, selectAuth } from '@/store/slices/authSlice';
import { storageKeys } from '@/lib/constants';

export function useAuthInit() {
  const dispatch = useDispatch();
  const { token } = useSelector(selectAuth);

  useEffect(() => {
    const init = async () => {
      if (token) await dispatch(fetchProfile());
      dispatch(setInitialized());
    };
    init();
  }, [dispatch, token]);
}

export function useAuth() {
  return useSelector(selectAuth);
}
