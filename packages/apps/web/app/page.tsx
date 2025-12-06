import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LandingPage from './_components/LandingPage';

/**
 * The Root Page (/).
 * 
 * Logic:
 * 1. Check if user is logged in (via cookie).
 * 2. If YES -> Redirect to Dashboard.
 * 3. If NO -> Render the Marketing Landing Page.
 */
export default function RootPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('flowsplit_token');

  if (token) {
    redirect('/dashboard/overview');
  }

  // Render the marketing page for visitors
  return <LandingPage />;
}