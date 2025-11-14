'use client';

import { Wallet, WalletType } from '@flowsplit/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { formatCurrency } from '../../../../lib/walletService';
import { PiggyBank, Landmark, ShieldCheck } from 'lucide-react';

const getWalletIcon = (type: WalletType) => {
  switch (type) {
    case 'SAVINGS': return <PiggyBank className="h-5 w-5 text-muted-foreground" />;
    case 'BILL': return <ShieldCheck className="h-5 w-5 text-muted-foreground" />;
    default: return <Landmark className="h-5 w-5 text-muted-foreground" />;
  }
};

export const WalletCard = ({ wallet }: { wallet: Wallet }) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{wallet.name}</CardTitle>
        {getWalletIcon(wallet.type)}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatCurrency(wallet.balance, wallet.currency)}
        </div>
        <p className="text-xs text-muted-foreground capitalize">
          {wallet.type.toLowerCase()} Wallet
        </p>
      </CardContent>
    </Card>
  );
};