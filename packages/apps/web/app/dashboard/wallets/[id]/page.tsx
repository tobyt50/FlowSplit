'use client';

import React, { useEffect, useState } from 'react';
import { Wallet, Transaction } from '@flowsplit/prisma';
import { getWalletById, formatCurrency } from '../../../../lib/walletService';
import { getTransactions } from '../../../../lib/transactionService';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { RecentTransactions } from '../../overview/_components/RecentTransactions'; // Reuse this component!
import { Separator } from '../../../../components/ui/Separator';
import { DeleteWalletModal } from '../_components/DeleteWalletModal';
import { ArrowLeft, PlusCircle, Trash2, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AddFundsModal } from '../../overview/_components/AddFundsModal'; // Reuse this too!

export default function WalletDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [w, tx] = await Promise.all([
          getWalletById(params.id),
          getTransactions(params.id) // Fetch transactions specifically for this wallet
        ]);
        setWallet(w);
        setTransactions(tx);
      } catch (error) {
        // Handle 404 or other errors by redirecting back to list
        router.push('/dashboard/wallets');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  if (isLoading || !wallet) return <div className="p-8 text-center">Loading details...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Navigation */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/wallets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">{wallet.name}</h1>
      </div>

      {/* Main Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Current Balance</p>
            <div className="text-4xl font-bold mt-1 text-primary">
              {formatCurrency(wallet.balance, wallet.currency)}
            </div>
            <p className="text-sm text-muted-foreground mt-1 capitalize">{wallet.type.toLowerCase()} Wallet</p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button onClick={() => setIsAddFundsOpen(true)} className="flex-1 sm:flex-none">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Funds
            </Button>
            {/* Future feature: Edit wallet name/rules */}
            <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/rules')}>
                <Settings className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transaction History</h2>
        </div>
        {/* We pass the filtered transactions here. The component might need a slight tweak 
            to handle long lists or pagination in a real V2, but works for V1 */}
        <RecentTransactions transactions={transactions} /> 
      </div>

      <Separator />

      {/* Danger Zone */}
      <div className="pt-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 flex items-center justify-between">
            <div>
                <h3 className="text-sm font-semibold text-destructive">Delete Wallet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                    Permanently remove this wallet. Funds must be transferred before deletion.
                </p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
        </div>
      </div>

      {/* Modals */}
      <DeleteWalletModal 
        isOpen={isDeleteOpen} 
        onClose={() => setIsDeleteOpen(false)} 
        walletToDelete={wallet} 
      />
      <AddFundsModal 
        isOpen={isAddFundsOpen} 
        onClose={() => setIsAddFundsOpen(false)} 
      />
    </div>
  );
}