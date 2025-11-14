'use client';

import React, { useEffect, useState } from 'react';
import { Wallet } from '@flowsplit/prisma';
import { getWallets, formatCurrency } from '../../lib/walletService';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Landmark, PiggyBank, Briefcase } from 'lucide-react';

// Server-side auth check is no longer needed here as we will use a client-side HOC
// We will build this HOC in the next step.

function DashboardPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const userWallets = await getWallets();
        setWallets(userWallets);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Calculate key metrics from the fetched wallet data
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0n);
  const totalWallets = wallets.length;
  const savingsWallets = wallets.filter(w => w.type === 'SAVINGS').length;

  const renderContent = () => {
    if (isLoading) return <p>Loading dashboard...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Smart Wallets</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWallets}</div>
            <p className="text-xs text-muted-foreground">Total wallets created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Savings Wallets</CardTitle>
            <PiggyBank className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{savingsWallets}</div>
            <p className="text-xs text-muted-foreground">Dedicated savings goals</p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-4">Dashboard</h1>
        {renderContent()}
        {/* We can add charts and recent transactions here later */}
      </div>
  );
}

export default DashboardPage;