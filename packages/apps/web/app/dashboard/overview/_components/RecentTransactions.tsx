'use client';

import React from 'react';
import Link from 'next/link';
import { Transaction, TransactionType } from '@flowsplit/prisma';
import { formatCurrency } from '../../../../lib/walletService';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../../../components/ui/Card';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
    
  const renderTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'CREDIT': return <Badge variant="default">Credit</Badge>;
      case 'DEBIT': return <Badge variant="destructive">Debit</Badge>;
      default: return <Badge variant="secondary">Transfer</Badge>;
    }
  };

  return (
    <Card className="h-[400px] flex flex-col">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your last 5 financial movements.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        {transactions.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium leading-none">
                    {tx.description || 'Deposit'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(tx.initiatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                    <div className="font-medium">{formatCurrency(tx.amount, tx.currency)}</div>
                    {renderTypeBadge(tx.type)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full" variant="outline">
          <Link href="/dashboard/transactions">View All Transactions</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}