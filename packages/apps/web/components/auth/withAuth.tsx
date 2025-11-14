'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../lib/authStore';

/**
 * A Higher-Order Component (HOC) that protects a page from unauthenticated access.
 *
 * @param Component - The page component to wrap and protect.
 * @returns A new component that renders the original component only if the user is
 *          authenticated, otherwise it redirects to the login page.
 */
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (isClient && !isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, isClient, router]);

    // Render a loading state or null on the server and before the client-side check runs
    if (!isClient || !isAuthenticated) {
      return null; // Or a full-page loader
    }

    // If authenticated, render the wrapped component with its props.
    return <Component {...props} />;
  };

  return AuthComponent;
};

export default withAuth;