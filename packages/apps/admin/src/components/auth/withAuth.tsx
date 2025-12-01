'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuthStore } from '../../lib/authStore';

/**
 * A Higher-Order Component (HOC) specifically for the Admin Dashboard.
 * It protects a wrapped component from unauthenticated access by checking
 * the `useAdminAuthStore`.
 */
const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  const AuthComponent = (props: P) => {
    const router = useRouter();
    const { isAuthenticated } = useAdminAuthStore();
    const [isClient, setIsClient] = useState(false);

    // This effect ensures our auth check only runs on the client after hydration
    useEffect(() => {
      setIsClient(true);
    }, []);

    useEffect(() => {
      if (isClient && !isAuthenticated) {
        router.replace('/login');
      }
    }, [isAuthenticated, isClient, router]);

    // Do not render the protected component until we have confirmed auth on the client
    if (!isClient || !isAuthenticated) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
            {/* You can replace this with a more sophisticated loader */}
            <p>Loading...</p>
        </div>
      );
    }

    // If authenticated, render the wrapped component with its props.
    return <Component {...props} />;
  };

  AuthComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
  return AuthComponent;
};

export default withAuth;