'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, SplitRule, Transaction } from '@flowsplit/prisma';
import { toast } from 'sonner';

// Components
import { OverviewCards } from './_components/OverviewCards';
import { WalletBreakdown } from './_components/WalletBreakdown';
import { RecentTransactions } from './_components/RecentTransactions';
import { UpcomingBills, UpcomingBill } from './_components/UpcomingBills';
import { ActiveRules } from './_components/ActiveRules';
import { InsightCard } from './_components/InsightCard';
import { CashFlowChart } from './_components/CashFlowChart';
import { LastSplitBreakdown } from './_components/LastSplitBreakdown';
import { AddFundsModal } from './_components/AddFundsModal';

// Services
import { getWallets } from '../../../lib/walletService';
import { getRules } from '../../../lib/ruleService';
import { getTransactions } from '../../../lib/transactionService';
import { getAIInsight, AIInsight } from '../../../lib/aiService';
import {
  getUpcomingBills,
  getCashFlow,
  CashFlowDataPoint,
  getLastSplitBreakdown,
  LastSplitBreakdown as LastSplitBreakdownData,
} from '../../../lib/dashboardService';

interface FullDashboardData {
  wallets: Wallet[];
  rules: SplitRule[];
  transactions: Transaction[];
  upcomingBills: UpcomingBill[];
  cashFlow: CashFlowDataPoint[];
  lastSplit: LastSplitBreakdownData | null;
  aiInsight: AIInsight | null;
}

export default function OverviewPage() {
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        wallets,
        rules,
        transactions,
        upcomingBills,
        cashFlow,
        lastSplit,
        aiInsight,
      ] = await Promise.all([
        getWallets(),
        getRules(),
        getTransactions(),
        getUpcomingBills(),
        getCashFlow(),
        getLastSplitBreakdown(),
        getAIInsight(),
      ]);

      setDashboardData({
        wallets,
        rules,
        transactions,
        upcomingBills,
        cashFlow,
        lastSplit,
        aiInsight,
      });
    } catch (err: any) {
      setError(err.message);
      toast.error('Dashboard Error', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const openModalHandler = () => setIsAddFundsOpen(true);
    document.addEventListener('open-add-funds-modal', openModalHandler);
    return () => document.removeEventListener('open-add-funds-modal', openModalHandler);
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
        Loading FlowSplit...
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="text-destructive text-center pt-10">
        Error: {error || 'Could not load data.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* --- SECTION 1: Top Metrics & Charts --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Main Content (Left) */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          {/* Top Assets (2x2 Grid on Mobile, Row on Desktop) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-lg font-semibold text-foreground">Top Financial Assets</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                Real-time
              </span>
            </div>
            
            {/* 
              Pass the compact chart as a child. 
              OverviewCards will render it in the 4th grid slot on mobile 
              and hide it on desktop.
            */}
            <OverviewCards data={dashboardData}>
                <CashFlowChart data={dashboardData.cashFlow} compact />
            </OverviewCards>
          </div>

          {/* AI Insight */}
          {dashboardData.aiInsight && <InsightCard insight={dashboardData.aiInsight} />}

          {/* Cash Flow Chart (Desktop Only - Full Version) */}
          <div className="hidden lg:block bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-foreground font-medium mb-4">Cash Flow Analytics</h3>
            <CashFlowChart data={dashboardData.cashFlow} />
          </div>
        </div>

        {/* Sidebar Content (Right) */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <WalletBreakdown wallets={dashboardData.wallets} rules={dashboardData.rules} />
          <LastSplitBreakdown data={dashboardData.lastSplit} />
        </div>
      </div>


      {/* --- SECTION 2: Active Management --- */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 px-1">Active Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="h-full">
                <ActiveRules
                    rules={dashboardData.rules}
                    wallets={dashboardData.wallets}
                    onRuleToggle={fetchDashboardData}
                />
            </div>

            <div className="h-full">
                <UpcomingBills bills={dashboardData.upcomingBills} />
            </div>

            <div className="h-full">
                <RecentTransactions transactions={dashboardData.transactions} />
            </div>
        </div>
      </div>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
    </div>
  );
}