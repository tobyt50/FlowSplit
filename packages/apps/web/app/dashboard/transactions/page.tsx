'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getTransactions } from '../../../lib/transactionService';
import { formatCurrency } from '../../../lib/walletService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../_components/EmptyState';
import { History, ArrowDownLeft, ArrowUpRight, CreditCard } from 'lucide-react';
import { UnifiedTransaction } from '../../../types';
import { useHeaderStore } from '../../../lib/headerStore';

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { setHeader } = useHeaderStore();

  const fetchData = useCallback(async () => {
  try {
    setIsLoading(true);
    const userTransactions = await getTransactions();
    setTransactions(userTransactions);
    setHeader({ 
      title: 'Transaction History', 
      count: userTransactions.length, 
      label: 'Records' 
    });
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}, [setHeader]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderTypeBadge = (tx: UnifiedTransaction) => {
    if (tx.source === 'CARD') {
      return (
        <Badge variant="secondary" className="gap-1 pl-1.5 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800">
          <CreditCard className="h-3 w-3" /> Card
        </Badge>
      );
    }

    switch (tx.type) {
      case 'CREDIT':
        return (
          <Badge variant="outline" className="gap-1 pl-1.5 border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800">
            <ArrowDownLeft className="h-3 w-3" /> Credit
          </Badge>
        );
      case 'DEBIT':
        return (
          <Badge variant="destructive" className="gap-1 pl-1.5">
            <ArrowUpRight className="h-3 w-3" /> Debit
          </Badge>
        );
      default:
        return <Badge variant="outline">{tx.type}</Badge>;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
          Loading History...
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="text-destructive text-center pt-10 bg-destructive/10 p-6 rounded-xl border border-destructive/20">
          Error: {error}
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <EmptyState
          icon={History}
          title="No Transactions Yet"
          description="Your transaction history will appear here once you receive your first deposit or make a spend."
          actionText="View Wallets"
          onActionClick={() => window.location.href = '/dashboard/wallets'}
        />
      );
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[120px] md:w-[150px]">Date</TableHead>
              <TableHead className="min-w-[150px]">Description</TableHead>
              <TableHead className="w-[120px]">Type</TableHead>
              <TableHead className="text-right w-[120px]">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow 
                key={tx.id} 
                className="border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                // --- UPDATED: Allow clicking on ALL transactions ---
                onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
              >
                <TableCell className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                  {new Date(tx.date).toLocaleDateString()}
                  <span className="hidden md:inline ml-1 text-muted-foreground/50">
                    {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground text-xs md:text-sm">
                  {tx.title}
                  {tx.subtitle && (
                      <span className="block text-[10px] text-muted-foreground font-normal">
                          {tx.subtitle}
                      </span>
                  )}
                </TableCell>
                <TableCell>
                  {renderTypeBadge(tx)}
                </TableCell>
                <TableCell className={`text-right font-mono text-xs md:text-sm font-medium ${
                    tx.type === 'CREDIT' ? 'text-green-500' : 'text-foreground'
                }`}>
                  {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      <div className="flex flex-col gap-1 px-1">
        <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground md:hidden">Transaction History</h2>
            <Badge variant="outline" className="md:hidden sm:flex bg-muted text-muted-foreground border-border">
                {transactions.length} Records
            </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          A unified timeline of all deposits, transfers, and card spending.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}