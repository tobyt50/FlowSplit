'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { formatCurrency } from '../../../../lib/utils';
import { TransactionType } from '@flowsplit/prisma';

interface Transaction {
  id: string;
  description: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  initiatedAt: string;
}

interface UserTransactionsListProps {
  transactions: Transaction[];
}

export function UserTransactionsList({ transactions }: UserTransactionsListProps) {
  if (transactions.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">This user has no transactions yet.</p>;
  }

  const renderTypeBadge = (type: TransactionType) => {
    switch (type) {
      case 'CREDIT': return <Badge variant="default" className="bg-green-600">Credit</Badge>;
      case 'DEBIT': return <Badge variant="destructive">Debit</Badge>;
      default: return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
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
            <TableCell>{new Date(tx.initiatedAt).toLocaleDateString()}</TableCell>
            <TableCell className="font-medium">{tx.description || 'N/A'}</TableCell>
            <TableCell>{renderTypeBadge(tx.type)}</TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(tx.amount, tx.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}