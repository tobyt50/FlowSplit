'use client';

import React, { useState, useMemo } from 'react';
import { Wallet, SplitRule } from '../../../../types/index';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../../../lib/walletService';
import { WalletDetailView } from './WalletDetailView';
import { PieChart as PieChartIcon, List, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';

interface WalletBreakdownProps {
  wallets: Wallet[];
  rules: SplitRule[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export function WalletBreakdown({ wallets, rules }: WalletBreakdownProps) {
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const chartData = useMemo(() => wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    value: Number(wallet.balance),
  })), [wallets]);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedWalletRules = rules.filter(r => r.destinationWalletId === selectedWalletId);

  if (selectedWallet) {
    return (
      <Card className="h-[450px] overflow-hidden">
        <WalletDetailView
          wallet={selectedWallet}
          rules={selectedWalletRules}
          onBack={() => setSelectedWalletId(null)}
        />
      </Card>
    );
  }

  return (
    <Card className="relative flex flex-col h-[350px] overflow-hidden transition-all">
      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-5 px-5 z-10">
        <div>
          <CardTitle className="text-lg">Wallet Portfolio</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Asset distribution overview.
          </p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
           <Button
             variant={view === 'chart' ? 'default' : 'ghost'}
             size="icon"
             className="h-7 w-7 rounded-md"
             onClick={() => setView('chart')}
           >
             <PieChartIcon className="h-4 w-4" />
           </Button>
           <Button
             variant={view === 'list' ? 'default' : 'ghost'}
             size="icon"
             className="h-7 w-7 rounded-md"
             onClick={() => setView('list')}
           >
             <List className="h-4 w-4" />
           </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col items-center justify-center relative p-4 z-10 min-h-0">
         {wallets.length === 0 ? (
           <p className="text-muted-foreground text-sm">No funds allocated yet.</p>
         ) : view === 'chart' ? (
           <div className="w-full h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie 
                      data={chartData.filter(d => d.value > 0)} 
                      dataKey="value" 
                      nameKey="name" 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={55}
                      outerRadius={75}
                      stroke="none"
                      paddingAngle={5}
                  >
                      {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                  </Pie>
                  <Tooltip 
                      formatter={(value: number) => formatCurrency(BigInt(value))} 
                      contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--popover-foreground))', 
                          borderRadius: 'var(--radius)' 
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-foreground">{wallets.length}</span>
                  <span className="text-xs text-muted-foreground">Wallets</span>
              </div>
           </div>
         ) : (
           <div className="w-full h-full overflow-y-auto space-y-2 pr-2">
              {wallets.map((wallet, idx) => (
                  <div 
                      key={wallet.id} 
                      className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border hover:bg-muted/80 cursor-pointer transition-colors"
                      onClick={() => setSelectedWalletId(wallet.id)}
                  >
                      <div className="flex items-center gap-3">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                          <div>
                              <p className="text-sm font-medium text-foreground">{wallet.name}</p>
                          </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-mono">{formatCurrency(wallet.balance)}</span>
                  </div>
              ))}
           </div>
         )}
      </CardContent>

      <div className="p-4 pt-0 mt-auto z-10">
        <Button className="w-full h-10 rounded-xl shadow-md" size="sm">
            Manage Wallets <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </div>
    </Card>
  );
}