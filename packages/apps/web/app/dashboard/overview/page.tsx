'use client';

import React, { useEffect, useState, useCallback } from 'react';
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

// Modals
import { InternalTransferModal } from './_components/InternalTransferModal';
import { CreateRuleForm } from '../rules/_components/CreateRuleForm';
import { EditRuleForm } from '../rules/_components/EditRuleForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';

// Services
import { getWallets } from '../../../lib/walletService';
import { getRules } from '../../../lib/ruleService';
import { getTransactions } from '../../../lib/transactionService';
import { UnifiedTransaction } from '../../../types/index';
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
  const [dashboardData, setDashboardData] = useState<FullDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States
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
      ] = await Promise.all([
        getWallets(),
        getRules(),
        getTransactions(),
        getUpcomingBills(),
        getCashFlow(),
        getLastSplitBreakdown(),
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
  const handleUnallocatedTransfer = (event: Event) => {
    const customEvent = event as CustomEvent<{ amount?: string }>;
    const payload = customEvent.detail;

    if (dashboardData?.wallets) {
      const sourceWallet = dashboardData.wallets.find(w => w.type === 'SOURCE');
      if (sourceWallet) {
        setTransferProps({
          fromId: sourceWallet.id,
          amount: payload?.amount,
        });
        setIsTransferModalOpen(true);
      } else {
        toast.error('Source wallet not found.');
      }
    }
  };

  document.addEventListener('open-transfer-modal-unallocated', handleUnallocatedTransfer);

  return () => {
    document.removeEventListener('open-transfer-modal-unallocated', handleUnallocatedTransfer);
  };
}, [dashboardData]);

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
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-8 flex flex-col gap-6">
          <div>
            <div className="flex items-center justify-between px-1 mb-4">
              <h2 className="text-lg font-semibold text-foreground">Top Financial Assets</h2>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">
                Real-time
              </span>
            </div>
            <OverviewCards data={dashboardData}>
                <div className="lg:hidden">
                    <CashFlowChart data={dashboardData.cashFlow} compact />
                </div>
            </OverviewCards>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
               <div className="hidden lg:block bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden h-full">
                  <h3 className="text-foreground font-medium mb-4">Cash Flow Analytics</h3>
                  <CashFlowChart data={dashboardData.cashFlow} />
               </div>
            </div>
            <div className="lg:col-span-1">
               <LastSplitBreakdown data={dashboardData.lastSplit} />
            </div>
          </div>
          
          <div className="flex-1">
            <RecentTransactions transactions={dashboardData.transactions} />
          </div>        
        </div>

        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <WalletBreakdown wallets={dashboardData.wallets} rules={dashboardData.rules} />
          <LimitsCard />
        </div>
      </div>

      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ActiveRules
                rules={dashboardData.rules}
                wallets={dashboardData.wallets}
                onRuleToggle={fetchDashboardData}
            />
            <UpcomingBills bills={dashboardData.upcomingBills} />
        </div>
      </div>
      
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