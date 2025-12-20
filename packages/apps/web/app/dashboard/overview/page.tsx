'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wallet, SplitRule } from '../../../types/index';
import { toast } from 'sonner';

// Components
import { OverviewCards } from './_components/OverviewCards';
import { WalletBreakdown } from './_components/WalletBreakdown';
import { RecentTransactions } from './_components/RecentTransactions';
import { UpcomingBills, UpcomingBill } from './_components/UpcomingBills';
import { ActiveRules } from './_components/ActiveRules';
import { CashFlowChart } from './_components/CashFlowChart';
import { LastSplitBreakdown } from './_components/LastSplitBreakdown';
import { AddFundsModal } from './_components/AddFundsModal';

// Modals
import { InternalTransferModal } from './_components/InternalTransferModal';
import { CreateRuleForm } from '../rules/_components/CreateRuleForm';
import { EditRuleForm } from '../rules/_components/EditRuleForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

// Services
import { getWallets } from '../../../lib/walletService';
import { getRules } from '../../../lib/ruleService';
import { getTransactions } from '../../../lib/transactionService';
import { getAIInsight } from '../../../lib/aiService';
import { UnifiedTransaction } from '../../../types/index'
import {
  getUpcomingBills,
  getCashFlow,
  CashFlowDataPoint,
  getLastSplitBreakdown,
  LastSplitBreakdown as LastSplitBreakdownData,
} from '../../../lib/dashboardService';
import { LimitsCard } from './_components/LimitsCard';

interface FullDashboardData {
  wallets: Wallet[];
  rules: SplitRule[];
  transactions: UnifiedTransaction[];
  upcomingBills: UpcomingBill[];
  cashFlow: CashFlowDataPoint[];
  lastSplit: LastSplitBreakdownData | null;
}

export default function OverviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modal States
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferProps, setTransferProps] = useState<{ fromId?: string, amount?: string }>({});
  const [isEditRuleOpen, setIsEditRuleOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<SplitRule | null>(null);
  const [isCreateRuleOpen, setIsCreateRuleOpen] = useState(false);
  const [createRuleDefaults, setCreateRuleDefaults] = useState<{ name?: string, value?: number, isBill?: boolean }>({});

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

  useEffect(() => {
    const action = searchParams.get('action');
    
    if (action === 'transfer_unallocated' && dashboardData?.wallets) {
      const sourceWallet = dashboardData.wallets.find(w => w.type === 'SOURCE');
      // We assume the amount is the full balance of the source wallet
      if (sourceWallet && BigInt(sourceWallet.balance) > 0n) {
          setTransferProps({
            fromId: sourceWallet.id,
            amount: sourceWallet.balance.toString(),
          });
          setIsTransferModalOpen(true);
          
          // Clean up URL without reloading
          router.replace('/dashboard/overview', { scroll: false });
      }
    }
  }, [searchParams, dashboardData, router]);

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
      
      {/* --- Main Dashboard Grid --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (Main Metrics & Charts) - Spans 8 cols */}
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          
          {/* 1. Overview Cards (Top) */}
          <div>
            <div className="flex items-center justify-between px-1 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Top Financial Assets</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                Real-time
              </span>
            </div>
            <OverviewCards data={dashboardData}>
                {/* Mobile-only compact chart */}
                <div className="lg:hidden">
                    <CashFlowChart data={dashboardData.cashFlow} compact />
                </div>
            </OverviewCards>
          </div>

          {/* 2. Cash Flow & Last Split Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <div className="hidden lg:block bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden">
            <h3 className="text-foreground font-medium mb-4">Cash Flow Analytics</h3>
            <CashFlowChart data={dashboardData.cashFlow} />
          </div>
            </div>
            <div className="lg:col-span-1">
               <LastSplitBreakdown data={dashboardData.lastSplit} />
            </div>
          </div>          
        </div>

        {/* Right Column (Sidebar Widgets) - Spans 4 cols */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <WalletBreakdown wallets={dashboardData.wallets} rules={dashboardData.rules} />
          <LimitsCard />
          {/* Transaction History now lives in the sidebar for better density */}
          <div className="flex-1 min-h-[300px]">
            <RecentTransactions transactions={dashboardData.transactions} />
          </div>
        </div>
      </div>

      {/* --- Active Management Section (Bottom Full Width) --- */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 px-1">Active Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActiveRules
                rules={dashboardData.rules}
                wallets={dashboardData.wallets}
                onRuleToggle={fetchDashboardData}
            />
            <UpcomingBills bills={dashboardData.upcomingBills} />
        </div>
      </div>

      {/* --- Modals --- */}
      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
      
      <InternalTransferModal 
        isOpen={isTransferModalOpen}
        onClose={() => { setIsTransferModalOpen(false); setTransferProps({}); }}
        onSuccess={fetchDashboardData}
        initialFromWalletId={transferProps.fromId}
        initialAmount={transferProps.amount}
      />

      <Dialog open={isEditRuleOpen} onOpenChange={(open) => { setIsEditRuleOpen(open); if(!open) setRuleToEdit(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Optimize Savings Rule</DialogTitle></DialogHeader>
          {ruleToEdit && (
            <EditRuleForm 
              rule={ruleToEdit} 
              onSuccess={() => { setIsEditRuleOpen(false); fetchDashboardData(); }} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isCreateRuleOpen} onOpenChange={(open) => { setIsCreateRuleOpen(open); if(!open) setCreateRuleDefaults({}); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Automate New Bill</DialogTitle></DialogHeader>
          <CreateRuleForm 
            defaults={createRuleDefaults}
            onSuccess={() => { setIsCreateRuleOpen(false); fetchDashboardData(); }} 
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}