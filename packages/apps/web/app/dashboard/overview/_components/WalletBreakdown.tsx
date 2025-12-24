'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export function WalletBreakdown({ wallets, rules }: WalletBreakdownProps) {
  const router = useRouter();
  const [view, setView] = useState<'chart' | 'list'>('chart');
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const chartData = useMemo(() => wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name,
    value: Number(wallet.balance),
  })), [wallets]);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);
  const selectedWalletRules = rules.filter(r => r.destinationWalletId === selectedWalletId);

  // If a wallet is selected (drilled down), show the detail view
  if (selectedWallet) {
    return (
      <Card className="h-[450px] overflow-hidden border-none shadow-none ring-1 ring-border">
        <WalletDetailView
          wallet={selectedWallet}
          rules={selectedWalletRules}
          onBack={() => setSelectedWalletId(null)}
        />
      </Card>
    );
  }

  // Helper to handle pie chart clicks
  const handlePieClick = (data: any) => {
    if (data && data.id) {
      setSelectedWalletId(data.id);
    }
  };

  return (
    <Card className="relative flex flex-col h-[350px] overflow-hidden transition-all duration-300">
      
      {/* Header */}
      <CardHeader className="flex flex-row items-start justify-between pb-2 pt-6 px-6 z-10">
        <div className="space-y-1">
          <CardTitle className="text-md font-bold tracking-tight">Wallet Portfolio</CardTitle>
          <p className="text-xs text-muted-foreground">
            Asset distribution across {wallets.length} wallets.
          </p>
        </div>
        <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50">
           <Button
             variant={view === 'chart' ? 'default' : 'ghost'}
             size="icon"
             className="h-7 w-7 rounded-md transition-all"
             onClick={() => setView('chart')}
           >
             <PieChartIcon className="h-4 w-4" />
           </Button>
           <Button
             variant={view === 'list' ? 'default' : 'ghost'}
             size="icon"
             className="h-7 w-7 rounded-md transition-all"
             onClick={() => setView('list')}
           >
             <List className="h-4 w-4" />
           </Button>
        </div>
      </CardHeader>

      {/* Content Area */}
      <CardContent className="flex-1 flex flex-col items-center justify-center relative p-6 z-10 min-h-0">
         {wallets.length === 0 ? (
           <div className="text-center space-y-2">
             <div className="h-12 w-12 bg-muted rounded-full mx-auto flex items-center justify-center">
                <PieChartIcon className="h-6 w-6 text-muted-foreground opacity-50" />
             </div>
             <p className="text-muted-foreground text-sm">No funds allocated yet.</p>
           </div>
         ) : view === 'chart' ? (
           <div className="w-full h-full relative animate-in fade-in duration-500">
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
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                      paddingAngle={4}
                      onClick={handlePieClick}
                      className="cursor-pointer outline-none"
                  >
                      {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            className="hover:opacity-80 transition-opacity"
                          />
                      ))}
                  </Pie>
                  <Tooltip 
                      wrapperStyle={{ zIndex: 9999 }}
                      formatter={(value: number) => formatCurrency(BigInt(value))} 
                      contentStyle={{ 
                          backgroundColor: 'hsl(var(--popover))', 
                          borderColor: 'hsl(var(--border))', 
                          color: 'hsl(var(--popover-foreground))', 
                          borderRadius: 'calc(var(--radius) - 2px)',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          fontSize: '12px'
                      }}
                      itemStyle={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}
                      cursor={false}
                  />
                  </PieChart>
              </ResponsiveContainer>
              
              {/* Center Stat */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-3xl font-extrabold text-foreground">{wallets.length}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Wallets</span>
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

      {/* Footer Button */}
      <div className="p-6 pt-0 mt-auto z-10">
        <Button 
            variant="default" 
            className="w-full h-10 rounded-xl font-medium" 
            size="sm"
            onClick={() => router.push('/dashboard/wallets')}
        >
            Manage Wallets <ArrowRight className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </div>
    </Card>
  );
}