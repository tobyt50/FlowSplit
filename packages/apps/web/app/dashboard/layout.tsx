'use client';

import React from 'react';
import { Sidebar } from './_components/Sidebar';
import { Header } from './_components/Header';
import withAuth from '../../components/auth/withAuth';
import { AIInsightManager } from './_components/AIInsightManager';

function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 selection:bg-primary/20">
      {/* 
        Grid Layout:
        - Mobile: 1 column (Sidebar becomes fixed bottom dock).
        - Desktop: 2 columns (Sidebar takes 250px).
      */}
      <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] lg:grid-cols-[260px_1fr]">
        <Sidebar />
        
        <div className="flex flex-col min-w-0">
          <Header />
          {/* 
             Content Area:
             - pb-24: Bottom padding on mobile to prevent content from being hidden behind the fixed Bottom Dock.
             - md:pb-8: Standard padding on desktop.
          */}
          <main className="flex-1 px-4 py-4 sm:px-6 md:px-8 pb-24 md:pb-8 overflow-x-hidden">
            {children}
            <AIInsightManager />
          </main>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardShell);