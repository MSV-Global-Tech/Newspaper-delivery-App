import { useEffect } from 'react';
import { router } from 'expo-router';
import { getSessionUser } from '../utils/session';
import { store } from '../utils/store';

export default function IndexScreen() {
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const sessionUser = await getSessionUser();

        console.log('[Index] Session check:', { sessionUser: sessionUser?.phone });

        if (sessionUser) {
          console.log('[Index] Restoring session for:', sessionUser.phone);
          store.setUser(sessionUser as any);
        }
        if (!mounted) return;

        if (sessionUser) {
          console.log('[Index] Routing to home (session valid)');
          router.replace('/customer/bottom_nav/home');
          return;
        }

        console.log('[Index] Routing to login (no session)');
        router.replace('/customer/login');
      } catch (error) {
        console.error('[Index] Session check failed:', error);
        if (mounted) {
          router.replace('/customer/login');
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return null;
}
