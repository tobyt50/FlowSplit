'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './_components/Sidebar';
import { Header } from './_components/Header';
import withAuth from '../../components/auth/withAuth';
import { AIInsightManager } from './_components/AIInsightManager';
import { AddFundsModal } from './_components/AddFundsModal';

function DashboardShell({ children }: { children: React.ReactNode }) {
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  useEffect(() => {
    const openModalHandler = () => setIsAddFundsOpen(true);
    document.addEventListener('open-add-funds-modal', openModalHandler);
    return () => document.removeEventListener('open-add-funds-modal', openModalHandler);
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground transition-colors duration-300 selection:bg-primary/20">
      <div className="grid min-h-screen w-full md:grid-cols-[250px_1fr] lg:grid-cols-[260px_1fr]">
        <Sidebar />
        
        <div className="flex flex-col min-w-0">
          <Header />
          <main className="flex-1 px-4 py-4 sm:px-6 md:px-8 pb-24 md:pb-8 overflow-x-hidden">
            {children}
            <AIInsightManager />
            
            <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
          </main>
        </div>
      </div>
    </div>
  );
}

export default withAuth(DashboardShell);