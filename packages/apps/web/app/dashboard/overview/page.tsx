'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wallet, SplitRule, Transaction } from '@flowsplit/prisma';

//UI Components
import { Button } from '../../../components/ui/Button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '../../../components/ui/Separator';

//Dashboard Cards
import { OverviewCards } from './_components/OverviewCards';
import { WalletBreakdown } from './_components/WalletBreakdown';
import { RecentTransactions } from './_components/RecentTransactions';
import { UpcomingBills, UpcomingBill } from './_components/UpcomingBills';
import { ActiveRules } from './_components/ActiveRules';
import { InsightCard } from './_components/InsightCard';
import { CashFlowChart } from './_components/CashFlowChart';
import { LastSplitBreakdown } from './_components/LastSplitBreakdown';
import { AddFundsModal } from './_components/AddFundsModal';

// Import all required data fetching functions from their dedicated services
import { getWallets } from '../../../lib/walletService';
import { getRules } from '../../../lib/ruleService';
import { getTransactions } from '../../../lib/transactionService';
import { getAIInsight, AIInsight } from '../../../lib/aiService';
import { getUpcomingBills, getCashFlow, CashFlowDataPoint, getLastSplitBreakdown, LastSplitBreakdown as LastSplitBreakdownData } from '../../../lib/dashboardService';

// This is the single, consolidated state object for the entire dashboard
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
      // Fetch all dashboard data in parallel for maximum performance
      const [wallets, rules, transactions, upcomingBills, cashFlow, lastSplit, aiInsight] = await Promise.all([
        getWallets(),
        getRules(),
        getTransactions(),
        getUpcomingBills(),
        getCashFlow(),
        getLastSplitBreakdown(),
        getAIInsight(),
      ]);
      setDashboardData({ wallets, rules, transactions, upcomingBills, cashFlow, lastSplit, aiInsight });
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

  const renderContent = () => {
    if (isLoading) return <p className="text-center pt-10">Loading your financial overview...</p>;
    if (error || !dashboardData) return <p className="text-destructive text-center pt-10">Error: {error || 'Could not load dashboard data.'}</p>;

    return (
      <div className="space-y-6">
        <OverviewCards data={dashboardData} />

        {dashboardData.aiInsight && (
            <InsightCard insight={dashboardData.aiInsight} />
        )}

        <div>
          <CashFlowChart data={dashboardData.cashFlow} />
        </div>
        
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <WalletBreakdown wallets={dashboardData.wallets} rules={dashboardData.rules} />
          </div>
          <div className="lg:col-span-2">
            {/* NEW: Place the LastSplitBreakdown component here */}
            <LastSplitBreakdown data={dashboardData.lastSplit} />
          </div>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <ActiveRules 
              rules={dashboardData.rules} 
              wallets={dashboardData.wallets}
              onRuleToggle={fetchDashboardData}
            />
            <UpcomingBills bills={dashboardData.upcomingBills} />
        </div>
        
        {/* RecentTransactions can be its own full-width section */}
        <RecentTransactions transactions={dashboardData.transactions} />
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground mt-1">
            A high-level snapshot of your financial landscape.
          </p>
        </div>
        {/* 5. The Add Funds Button */}
        <Button onClick={() => setIsAddFundsOpen(true)} size="lg" className="shadow-sm">
          <Plus className="mr-2 h-5 w-5" />
          Add Funds
        </Button>
      </div>

      <Separator />

      {renderContent()}

      {/* 6. The Modal Instance */}
      <AddFundsModal 
        isOpen={isAddFundsOpen} 
        onClose={() => setIsAddFundsOpen(false)} 
      />
    </div>
  );
}