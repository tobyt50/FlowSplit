'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This is a client-side redirect component.
 * Its sole purpose is to redirect any user who lands on the base '/dashboard'
 * route to the default '/dashboard/overview' page.
 * 
 * This prevents having duplicate content and establishes a clear information hierarchy.
 */
export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard/overview');
  }, [router]);

  // Render null or a loader while the redirect is happening.
  return null;
}