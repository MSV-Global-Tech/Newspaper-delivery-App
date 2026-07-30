import { Stack, usePathname } from 'expo-router';
import '../global.css';
import { useEffect, useRef } from 'react';
import { store } from '../utils/store';
import { getSessionUser, setLastRoute } from '../utils/session';

function shouldPersistRoute(pathname: string) {
  return pathname !== '/' && pathname !== '/customer/login' && pathname !== '/+not-found';
}

export default function RootLayout() {
  const pathname = usePathname();
  const bootedRef = useRef(false);

  // Restore the session user into the store once (covers deep-link entries).
  // All boot routing (onboarding vs login vs home) is handled by app/index.tsx
  // BEFORE it renders anything, so returning users never see the tour flash.
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    getSessionUser()
      .then((sessionUser) => {
        if (sessionUser && !store.getUser()) store.setUser(sessionUser as any);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (shouldPersistRoute(pathname)) setLastRoute(pathname);
  }, [pathname]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
