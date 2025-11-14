'use client';

import React from 'react';
import { Sidebar } from './_components/Sidebar';
import { Header } from './_components/Header';
import withAuth from '../../components/auth/withAuth';

/**
 * This is the central layout for the entire authenticated dashboard.
 * Any page created inside the `/dashboard` directory will automatically be
 * wrapped by this layout, ensuring a consistent UI with a persistent
 * sidebar and header.
 *
 * The `withAuth` HOC is applied here to protect all child routes.
 */
function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex-1 bg-background"> {/* Changed bg-muted/40 to bg-background for consistency */}
          {children}
        </main>
      </div>
    </div>
  );
}

// Wrap the shell with the authentication HOC.
// Now, any page inside /dashboard/* is automatically protected on the client-side.
export default withAuth(DashboardShell);