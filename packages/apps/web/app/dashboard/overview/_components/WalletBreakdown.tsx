'use client';

import React, { useState, useMemo } from 'react';
import { Wallet, SplitRule } from '@flowsplit/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { WalletDetailView } from './WalletDetailView';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../../../lib/walletService';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/ToggleGroup';
import { PieChart as PieChartIcon, List } from 'lucide-react';

interface WalletBreakdownProps {
  wallets: Wallet[];
  rules: SplitRule[];
}

interface CustomLegendPayload {
  value: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1975'];

export function WalletBreakdown({ wallets, rules }: WalletBreakdownProps) {
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const chartData = useMemo(() => wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    value: Number(wallet.balance),
  })), [wallets]);

  const handleLegendClick = (payload: CustomLegendPayload) => {
    const clickedWallet = chartData.find(w => w.name === payload.value);
    if (clickedWallet) {
      setSelectedWalletId(clickedWallet.id);
    }
  };

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedWalletRules = rules.filter(r => r.destinationWalletId === selectedWalletId);

  if (selectedWallet) {
    return (
      <Card className="h-[400px]">
        <WalletDetailView
          wallet={selectedWallet}
          rules={selectedWalletRules}
          onBack={() => setSelectedWalletId(null)}
        />
      </Card>
    );
  }

  return (
    <Card className="h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Wallet Allocation</CardTitle>
        <ToggleGroup type="single" value={view} onValueChange={(value) => value && setView(value as any)}>
          <ToggleGroupItem value="chart"><PieChartIcon className="h-4 w-4" /></ToggleGroupItem>
          <ToggleGroupItem value="list"><List className="h-4 w-4" /></ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent className="h-[calc(400px-72px)]">
        {wallets.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No funds allocated yet.</p>
          </div>
        ) : view === 'chart' ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData.filter(d => d.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
                {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(BigInt(value))} />
              <Legend onClick={handleLegendClick as any} wrapperStyle={{ cursor: 'pointer' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="space-y-2 pr-6 overflow-y-auto h-full">
            {wallets.map(wallet => (
              <div key={wallet.id} className="flex items-center p-2 rounded-md hover:bg-muted cursor-pointer" onClick={() => setSelectedWalletId(wallet.id)}>
                <div className="flex-1">
                  <p className="font-medium">{wallet.name}</p>
                  <p className="text-sm text-muted-foreground capitalize">{wallet.type.toLowerCase()} Wallet</p>
                </div>
                <div className="font-mono text-right">{formatCurrency(wallet.balance)}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}