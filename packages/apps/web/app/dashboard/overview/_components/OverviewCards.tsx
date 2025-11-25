'use client';

import React, { useMemo } from 'react';
import { Wallet, SplitRule, Transaction } from '@flowsplit/prisma';
import { formatCurrency } from '../../../../lib/walletService';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Landmark, PiggyBank, AlertCircle, Sparkles } from 'lucide-react';

// The props now expect a single object containing all necessary dashboard data
interface OverviewCardsProps {
  data: {
    wallets: Wallet[];
    rules: SplitRule[];
    transactions: Transaction[];
  };
}

/**
 * A component that displays a row of key financial metrics for the user's overview.
 * It calculates aggregated data like total balance and total saved.
 */
export function OverviewCards({ data }: OverviewCardsProps) {
  const { wallets } = data;

  // useMemo is used here for performance optimization. These complex calculations
  // will only re-run if the `wallets` data prop changes, not on every re-render.
  const metrics = useMemo(() => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0n);

    const totalSaved = wallets
      .filter((w) => w.type === 'SAVINGS')
      .reduce((sum, wallet) => sum + wallet.balance, 0n);

    // Placeholder for "Last Split Status". In a real scenario, this would
    // be derived from the most recent deposit transaction.
    const lastSplitStatus = { status: 'Success', color: 'text-green-500' };

    return { totalBalance, totalSaved, lastSplitStatus };
  }, [wallets]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total Balance Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          <Landmark className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalBalance)}</div>
          <p className="text-xs text-muted-foreground">Across all {wallets.length} wallets</p>
        </CardContent>
      </Card>

      {/* Total Saved Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Saved</CardTitle>
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(metrics.totalSaved)}</div>
          <p className="text-xs text-muted-foreground">In dedicated savings wallets</p>
        </CardContent>
      </Card>
      
      {/* Last Split Status Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Split Status</CardTitle>
          <AlertCircle className={`h-4 w-4 ${metrics.lastSplitStatus.color}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${metrics.lastSplitStatus.color}`}>{metrics.lastSplitStatus.status}</div>
          <p className="text-xs text-muted-foreground">From last deposit</p>
        </CardContent>
      </Card>
      
      {/* AI Recommendation Score Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Score</CardTitle>
          <Sparkles className="h-4 w-4 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">85%</div>
          <p className="text-xs text-muted-foreground">Optimization score</p>
        </CardContent>
      </Card>
    </div>
  );
}