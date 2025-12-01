'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../components/ui/Table';
import { Badge } from '../../../../components/ui/Badge';
import { formatCurrency } from '../../../../lib/utils';
import { WalletType } from '@flowsplit/prisma';

// Define the shape of the wallet data coming from the admin API
interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: string; // Comes as a string due to BigInt serialization
  currency: string;
}

interface UserWalletsListProps {
  wallets: Wallet[];
}

export function UserWalletsList({ wallets }: UserWalletsListProps) {
  if (wallets.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">This user has not created any wallets.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead className="text-right">Balance</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {wallets.map((wallet) => (
          <TableRow key={wallet.id}>
            <TableCell className="font-medium">{wallet.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{wallet.type}</Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
              {formatCurrency(wallet.balance, wallet.currency)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}