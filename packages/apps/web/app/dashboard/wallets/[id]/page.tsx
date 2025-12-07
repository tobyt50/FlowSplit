'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Transaction } from '../../../../types/index';
import { WalletType } from '../../../../lib/enums';
import { getWalletById, formatCurrency } from '../../../../lib/walletService';
import { getTransactions } from '../../../../lib/transactionService';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { Progress } from '../../../../components/ui/Progress';
import { DeleteWalletModal } from '../_components/DeleteWalletModal';
import { WithdrawFundsModal } from '../_components/WithdrawFundsModal';
import { EditWalletModal } from '../_components/EditWalletModal';
import { InternalTransferModal } from '../../overview/_components/InternalTransferModal';
import { AddFundsModal } from '../../overview/_components/AddFundsModal';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Settings, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ShieldCheck, 
  Landmark, 
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  PlusCircle,
  Banknote
} from 'lucide-react';
import { cn } from '../../../../lib/utils';

// Helper to get visual config based on wallet type
const getWalletTheme = (type: WalletType) => {
  switch (type) {
    case 'SAVINGS':
      return {
        color: "text-amber-500",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: PiggyBank
      };
    case 'BILL':
      return {
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: ShieldCheck
      };
    default:
      return {
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        icon: Landmark
      };
  }
};

export default function WalletDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  // Fetch Wallet & Transactions
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch specific wallet by ID
      const walletData = await getWalletById(params.id);
      setWallet(walletData);

      // 2. Fetch Transactions filtered for this wallet
      const allTx = await getTransactions(params.id);
      setTransactions(allTx.slice(0, 10)); // Limit to 10 recent

    } catch (error) {
      toast.error('Could not load wallet details.');
      router.push('/dashboard/wallets');
    } finally {
      setIsLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading || !wallet) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
        Loading Details...
      </div>
    );
  }

  const theme = getWalletTheme(wallet.type);
  const Icon = theme.icon;

  // Goal / Budget Calculations
  const balance = Number(wallet.balance);
  const target = Number(wallet.targetAmount || 0);
  const progress = target > 0 ? Math.min(100, (balance / target) * 100) : 0;
  const targetLabel = wallet.type === 'SAVINGS' ? 'Savings Goal' : 'Monthly Budget';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-lg font-semibold text-foreground">{wallet.name}</h2>
        </div>
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsEditOpen(true)}
                className="h-9 w-9 rounded-xl border-border bg-background hover:bg-muted"
            >
                <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setIsDeleteOpen(true)}
                className="h-9 w-9 rounded-xl border-border bg-background hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-colors"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* --- HERO CARD --- */}
      <div className={cn(
          "relative overflow-hidden rounded-3xl border p-6 md:p-8 flex flex-col justify-between min-h-[240px] shadow-sm transition-all",
          "bg-card",
          theme.border
      )}>
         {/* Background Gradients */}
         <div className={cn("absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none opacity-40", theme.bg)} />
         
         <div className="relative z-10 flex justify-between items-start">
            <div className={cn("p-3 rounded-2xl inline-flex", theme.bg)}>
                <Icon className={cn("h-6 w-6", theme.color)} />
            </div>
            <Badge variant="outline" className={cn("bg-background/50 backdrop-blur-md border-border", theme.color)}>
                {wallet.type} Wallet
            </Badge>
         </div>

         <div className="relative z-10 mt-6 space-y-4">
            <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                    {formatCurrency(wallet.balance, wallet.currency)}
                </h1>
            </div>

            {/* Goal Progress Bar */}
            <div className="space-y-2 max-w-md">
                <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{targetLabel}: {target > 0 ? formatCurrency(wallet.targetAmount) : 'Not Set'}</span>
                    <span>{progress.toFixed(0)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>
         </div>
      </div>

      {/* --- QUICK ACTIONS GRID --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
         <Button onClick={() => setIsAddFundsOpen(true)} variant="outline" className="h-20 flex-col gap-2 rounded-2xl border-dashed border-2 hover:border-primary hover:bg-primary/5">
            <PlusCircle className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium">Add Funds</span>
         </Button>
         <Button onClick={() => setIsTransferOpen(true)} variant="outline" className="h-20 flex-col gap-2 rounded-2xl hover:bg-muted">
            <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium">Transfer</span>
         </Button>
         <Button onClick={() => setIsWithdrawOpen(true)} variant="outline" className="h-20 flex-col gap-2 rounded-2xl hover:bg-muted">
            <Banknote className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium">Withdraw</span>
         </Button>
         <Button onClick={() => setIsEditOpen(true)} variant="outline" className="h-20 flex-col gap-2 rounded-2xl hover:bg-muted">
            <Settings className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs font-medium">Edit Goal</span>
         </Button>
      </div>

      {/* --- TRANSACTIONS LIST --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                <History className="h-4 w-4 text-primary" /> Recent Activity
            </h3>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {transactions.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
                    <History className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No transactions yet.</p>
                </div>
            ) : (
                <div className="divide-y divide-border/40">
                    {transactions.map((tx) => (
                        <div key={tx.id} className="group flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "flex h-10 w-10 items-center justify-center rounded-xl border",
                                    tx.type === 'CREDIT' ? "bg-green-500/10 border-green-500/20 text-green-500" : 
                                    tx.type === 'DEBIT' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                    "bg-blue-500/10 border-blue-500/20 text-blue-500"
                                )}>
                                    {tx.type === 'CREDIT' ? <ArrowDownLeft className="h-5 w-5" /> : 
                                     tx.type === 'DEBIT' ? <ArrowUpRight className="h-5 w-5" /> :
                                     <ArrowRightLeft className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">{tx.description || 'Transfer'}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.initiatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={cn(
                                    "text-sm font-bold font-mono",
                                    tx.type === 'DEBIT' ? "text-foreground" : "text-green-500"
                                )}>
                                    {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                                </p>
                                <Badge variant="secondary" className="text-[9px] h-4 px-1">{tx.status}</Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- MODALS --- */}
      <DeleteWalletModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        walletToDelete={wallet}
      />
      <WithdrawFundsModal 
        isOpen={isWithdrawOpen} 
        onClose={() => setIsWithdrawOpen(false)} 
        wallet={wallet} 
        onSuccess={fetchData} 
      />
      <InternalTransferModal 
        isOpen={isTransferOpen} 
        onClose={() => setIsTransferOpen(false)} 
        initialFromWalletId={wallet.id}
        onSuccess={fetchData}
      />
      <EditWalletModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        wallet={wallet}
        onSuccess={fetchData}
      />
      <AddFundsModal 
        isOpen={isAddFundsOpen} 
        onClose={() => setIsAddFundsOpen(false)} 
      />
    </div>
  );
}