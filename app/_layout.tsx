import { Stack } from 'expo-router';
import '../global.css';
import { useEffect, useRef } from 'react';
import { store } from '../utils/store';
import { getSessionUser } from '../utils/session';
import { checkAndShowUpdateAlert } from '../utils/appUpdates';

export default function RootLayout() {
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

    // Check for app updates
    checkAndShowUpdateAlert().catch(() => {});
  }, []);


  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
