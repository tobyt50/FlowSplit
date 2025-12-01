'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../../components/ui/Table';
import { Badge } from '../../../../../components/ui/Badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { BankAccount } from '../../../../../types/admin-api';

interface UserBankAccountsListProps {
  bankAccounts: BankAccount[];
}

export function UserBankAccountsList({ bankAccounts }: UserBankAccountsListProps) {
  if (bankAccounts.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">This user has not linked any bank accounts.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bank</TableHead>
          <TableHead>Account Number</TableHead>
          <TableHead>Account Name</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bankAccounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="font-medium">
              {account.bankName}
              {account.isPrimary && <Badge variant="outline" className="ml-2">Primary</Badge>}
            </TableCell>
            <TableCell className="font-mono">{account.accountNumber}</TableCell>
            <TableCell>{account.accountName}</TableCell>
            <TableCell>
              {account.isVerified ? (
                <span className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-2 text-destructive">
                  <XCircle className="h-4 w-4" /> Unverified
                </span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}