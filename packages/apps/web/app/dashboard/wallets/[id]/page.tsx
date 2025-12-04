'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, Transaction } from '../../../../types/index';
import { WalletType } from '../../../../lib/enums';
import { getWallets } from '../../../../lib/walletService';
import { getTransactions } from '../../../../lib/transactionService';
import { formatCurrency } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Card } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { DeleteWalletModal } from '../_components/DeleteWalletModal';
import { 
  ArrowLeft, 
  Pencil, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank, 
  ShieldCheck, 
  Landmark, 
  History,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft
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
        gradient: "from-amber-500/20 to-transparent",
        icon: PiggyBank
      };
    case 'BILL':
      return {
        color: "text-blue-500",
        bg: "bg-blue-500/10",
        border: "border-blue-500/20",
        gradient: "from-blue-500/20 to-transparent",
        icon: ShieldCheck
      };
    default:
      return {
        color: "text-primary",
        bg: "bg-primary/10",
        border: "border-primary/20",
        gradient: "from-primary/20 to-transparent",
        icon: Landmark
      };
  }
};

export default function WalletDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Fetch Wallet & Transactions
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Wallet (Simulating getById by fetching all and filtering, replace with direct API if available)
      const allWallets = await getWallets();
      const foundWallet = allWallets.find(w => w.id === params.id);
      
      if (!foundWallet) {
        router.push('/dashboard/wallets');
        return;
      }
      setWallet(foundWallet);

      // 2. Fetch Transactions (Simulating filter by wallet ID)
      // In a real app, you'd pass ?walletId=... to the API
      const allTx = await getTransactions();
      const walletTx = allTx.filter(() => true 
      ).slice(0, 10); // Limit to 10
      setTransactions(walletTx);

    } catch (error) {
      console.error(error);
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
          <h2 className="text-lg font-semibold text-foreground">Wallet Details</h2>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-border bg-background hover:bg-muted">
                <Pencil className="h-4 w-4 text-muted-foreground" />
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
          "relative overflow-hidden rounded-3xl border p-6 md:p-8 flex flex-col justify-between min-h-[200px] shadow-sm transition-all",
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

         <div className="relative z-10 mt-6">
            <p className="text-sm font-medium text-muted-foreground mb-1">Total Balance</p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">
                {formatCurrency(wallet.balance, wallet.currency)}
            </h1>
            <p className="text-xs text-muted-foreground mt-2 opacity-80">
                {wallet.name} • {wallet.currency}
            </p>
         </div>
      </div>

      {/* --- STATS GRID --- */}
      <div className="grid grid-cols-2 gap-4">
         <Card className="bg-card/50 border-border shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="p-1.5 rounded-full bg-green-500/10 text-green-500">
                    <TrendingUp className="h-3 w-3" />
                </div>
                Total In
            </div>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(BigInt(50000))}</p>
         </Card>
         <Card className="bg-card/50 border-border shadow-sm p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="p-1.5 rounded-full bg-red-500/10 text-red-500">
                    <TrendingDown className="h-3 w-3" />
                </div>
                Total Out
            </div>
            <p className="text-xl font-semibold text-foreground">{formatCurrency(BigInt(12000))}</p>
         </Card>
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
                <div className="p-8 text-center text-sm text-muted-foreground">
                    No transactions found for this wallet.
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

      <DeleteWalletModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        walletToDelete={wallet}
      />
    </div>
  );
}