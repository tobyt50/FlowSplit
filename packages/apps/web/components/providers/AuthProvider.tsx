'use client'; // This component also interacts with client-side state

import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/authStore';

/**
 * The AuthProvider is a client-side component responsible for initializing
 * the authentication state when the application loads in the browser.
 *
 * It addresses a common hydration issue:
 * 1. The server renders the initial HTML with a default auth state (logged out).
 * 2. The client loads, and the Zustand `persist` middleware rehydrates the
 *    auth state from localStorage (potentially logged in).
 * 3. This mismatch can cause a UI flash or a React hydration error.
 *
 * This component ensures that the UI doesn't render until the client-side
 * auth state has been fully loaded and synchronized, providing a smooth
 * user experience.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isHydrated, setIsHydrated] = useState(false);

  // Trigger the rehydration of the auth store on component mount.
  useEffect(() => {
    // This rehydrates the store from localStorage.
    useAuthStore.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  // Render a loading state or null until the store is hydrated.
  // This prevents any UI that depends on the auth state from rendering prematurely.
  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}