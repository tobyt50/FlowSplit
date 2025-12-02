'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Transaction, TransactionType } from '@flowsplit/prisma';
import { getTransactions } from '../../../lib/transactionService';
import { formatCurrency } from '../../../lib/walletService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../_components/EmptyState';
import { History, ArrowDownLeft, ArrowUpRight, ArrowRightLeft } from 'lucide-react';

export default function TransactionsPage() {
  const router = useRouter(); // Initialize router
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const userTransactions = await getTransactions();
      setTransactions(userTransactions);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const renderTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'CREDIT':
        return (
          <Badge variant="success" className="gap-1 pl-1.5">
            <ArrowDownLeft className="h-3 w-3" /> Credit
          </Badge>
        );
      case 'DEBIT':
        return (
          <Badge variant="destructive" className="gap-1 pl-1.5">
            <ArrowUpRight className="h-3 w-3" /> Debit
          </Badge>
        );
      case 'TRANSFER':
        return (
          <Badge variant="secondary" className="gap-1 pl-1.5">
             <ArrowRightLeft className="h-3 w-3" /> Transfer
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
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
          description="Your transaction history will appear here once you receive your first deposit."
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
                // ADD CLICK HANDLER HERE
                className="border-border/40 hover:bg-muted/30 cursor-pointer"
                onClick={() => router.push(`/dashboard/transactions/${tx.id}`)}
              >
                <TableCell className="text-muted-foreground text-xs md:text-sm whitespace-nowrap">
                  {new Date(tx.initiatedAt).toLocaleDateString()}
                  <span className="hidden md:inline ml-1 text-muted-foreground/50">
                    {new Date(tx.initiatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </TableCell>
                <TableCell className="font-medium text-foreground text-xs md:text-sm">
                  {tx.description || 'N/A'}
                </TableCell>
                <TableCell>
                  {renderTypeBadge(tx.type)}
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
            <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
            <Badge variant="outline" className="hidden sm:flex bg-muted text-muted-foreground border-border">
                {transactions.length} Records
            </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          A complete record of all your financial activities.
        </p>
      </div>

      {renderContent()}
    </div>
  );
}