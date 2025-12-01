'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, LedgerEntry, Wallet } from '@flowsplit/prisma';
import { getTransactionById } from '../../../../lib/transactionService';
import { formatCurrency } from '../../../../lib/walletService';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Extend the Transaction type to include ledger entries for the frontend
type TransactionWithLedger = Transaction & {
  ledgerTransaction?: {
    entries: (LedgerEntry & { wallet: { name: string } })[];
  };
};

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionWithLedger | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const txData = await getTransactionById(params.id);
        setTransaction(txData);
      } catch (error) {
        // Redirect if not found
        router.push('/dashboard/transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTx();
  }, [params.id, router]);

  if (isLoading || !transaction) {
    return <div className="p-8 text-center">Loading transaction details...</div>;
  }

  const creditEntries = transaction.ledgerTransaction?.entries.filter(e => e.type === 'CREDIT') || [];
  const debitEntry = transaction.ledgerTransaction?.entries.find(e => e.type === 'DEBIT');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Transaction Details</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-start">
            <span>{transaction.description || 'Transaction'}</span>
            <Badge variant={transaction.type === 'CREDIT' ? 'default' : 'destructive'}>
              {formatCurrency(transaction.amount)}
            </Badge>
          </CardTitle>
          <CardDescription>
            Reference: {transaction.reference} | Date: {new Date(transaction.initiatedAt).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <h3 className="font-semibold mb-2">Ledger Breakdown</h3>
          <div className="rounded-lg border p-4 space-y-4">
            {debitEntry && (
              <div className="flex items-center justify-between text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded-md">
                <span className="text-muted-foreground">From: <strong>{debitEntry.wallet.name}</strong></span>
                <span className="font-mono text-red-600 dark:text-red-400">-{formatCurrency(debitEntry.amount)}</span>
              </div>
            )}
            
            <div className="flex justify-center">
                <ArrowRight className="h-6 w-6 text-muted-foreground -rotate-90 sm:rotate-0" />
            </div>

            <div className="space-y-2">
            {creditEntries.map(entry => (
              <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                <span className="text-muted-foreground">To: <strong>{entry.wallet.name}</strong></span>
                <span className="font-mono text-green-600 dark:text-green-400">+{formatCurrency(entry.amount)}</span>
              </div>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}