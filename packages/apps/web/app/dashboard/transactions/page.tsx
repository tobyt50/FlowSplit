'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Transaction, TransactionType } from '@flowsplit/prisma';
import { getTransactions } from '../../../lib/transactionService';
import { formatCurrency } from '../../../lib/walletService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../_components/EmptyState';
import { History } from 'lucide-react';

export default function TransactionsPage() {
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
        return <Badge variant="default">Credit</Badge>;
      case 'DEBIT':
        return <Badge variant="destructive">Debit</Badge>;
      case 'TRANSFER':
        return <Badge variant="secondary">Transfer</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };
  
  const renderContent = () => {
    if (isLoading) return <p>Loading history...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;

    if (transactions.length === 0) {
        return (
            <EmptyState
              icon={History}
              title="No Transactions Yet"
              description="Your transaction history will appear here once you receive your first deposit."
              actionText="View Wallets" // Action could link to another relevant page
              onActionClick={() => window.location.href = '/dashboard/wallets'}
            />
          );
    }

    return (
        <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {new Date(tx.initiatedAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">{tx.description || 'N/A'}</TableCell>
                  <TableCell>{renderTypeBadge(tx.type)}</TableCell>
                  <TableCell className="text-right font-mono">
                    {formatCurrency(tx.amount, tx.currency)}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Transaction History</h1>
        <p className="text-muted-foreground mt-1">
          A complete record of all your financial activities.
        </p>
      </div>
      {renderContent()}
    </div>
  );
}