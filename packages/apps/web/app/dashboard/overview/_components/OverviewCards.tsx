'use client';

import React, { useMemo } from 'react';
import { Wallet, SplitRule, Transaction } from '../../../../types/index';
import { ArrowUpRight, Wallet as WalletIcon, PiggyBank, Zap } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { cn } from '../../../../lib/utils';
import Link from 'next/link';

interface OverviewCardsProps {
  data: {
    wallets: Wallet[];
    rules: SplitRule[];
    transactions: Transaction[];
  };
  children?: React.ReactNode; 
}

// --- SMART FORMATTER ---
const formatSmartNumber = (amount: bigint) => {
  // 1. Convert Kobo to Naira
  const nairaAmount = Number(amount) / 100;
  
  // 2. Case: 9 figures or more (≥ 100 Million) -> Use M, B, T
  if (nairaAmount >= 100_000_000) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency', 
      currency: 'NGN', 
      notation: 'compact', 
      maximumFractionDigits: 1 
    }).format(nairaAmount);
  }

  // 3. Case: 7 or 8 figures (1 Million to 99.99 Million) -> Hide Kobo, show full text
  if (nairaAmount >= 1_000_000) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0, // Explicitly remove decimals
    }).format(nairaAmount);
  }

  // 4. Case: Less than 1 Million -> Show full detail with Kobo
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(nairaAmount);
};

export function OverviewCards({ data, children }: OverviewCardsProps) {
  const { wallets, rules } = data;

  const metrics = useMemo(() => {
    // Summing BigInts (Kobo)
    const totalBalance = wallets.reduce((sum, wallet) => sum + BigInt(wallet.balance), 0n);
    const totalSaved = wallets
      .filter((w) => w.type === 'SAVINGS')
      .reduce((sum, wallet) => sum + BigInt(wallet.balance), 0n);
    
    // Calculate Active Rules instead of redundant wallet count
    const activeRules = rules.filter(r => r.isActive).length;

    return { totalBalance, totalSaved, activeRules };
  }, [wallets, rules]);

  const StatCard = ({ title, value, subValue, subtitle, icon: Icon, theme, href }: any) => (
    <Link href={href} className="block group">
    <div 
      className={cn(
        "group relative rounded-2xl p-[1px] h-[140px] md:h-auto transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        "bg-gradient-to-br via-transparent to-transparent",
        theme.borderGradient
      )}
    >
      <Card className="relative h-full w-full overflow-hidden bg-card border-none rounded-[15px] p-3 md:p-5 flex flex-col justify-between">
        
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20 pointer-events-none", theme.innerGradient)} />
        <Icon className={cn("absolute -bottom-4 -right-4 h-24 w-24 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:opacity-10", theme.text)} />

        {/* Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <div className={cn("flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg md:rounded-xl shadow-sm backdrop-blur-md", theme.iconBg, theme.text)}>
              <Icon className="h-4 w-4 md:h-5 md:w-5" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs font-medium text-muted-foreground leading-tight">{title}</p>
              <p className="hidden md:block text-sm font-semibold text-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary cursor-pointer">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        {/* Value Section */}
        <div className="relative z-10 mt-1 md:mt-6">
          <p className="hidden md:block text-xs text-muted-foreground mb-1">Current Metric</p>
          <div className="flex items-end gap-2">
             <h3 className="text-xl md:text-2xl font-bold text-foreground tracking-tighter transform scale-y-110 origin-bottom-left md:transform-none md:tracking-tight truncate max-w-full">
                {value}
             </h3>
          </div>
          <div className="mt-2 md:mt-2 flex items-center gap-2">
              <div className="flex items-center text-green-500 bg-green-500/10 px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-[10px] font-bold border border-green-500/20">
                <ArrowUpRight className="h-2.5 w-2.5 mr-1" />
                Active
              </div>
              <span className="hidden md:inline text-xs text-muted-foreground">{subValue}</span>
          </div>
        </div>

        {/* Decorative Chart Line */}
        <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 opacity-[0.05] group-hover:opacity-10 transition-opacity pointer-events-none">
          <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
              <path 
                  d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5 V 20 H 0 Z" 
                  fill={theme.chartColor} 
                  className="transition-all duration-1000"
              />
              <path 
                  d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5" 
                  fill="none" 
                  stroke={theme.chartColor} 
                  strokeWidth="0.5"
              />
          </svg>
        </div>
      </Card>
    </div>
    </Link>
  );

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
      <StatCard 
        title="Total Balance" 
        subtitle="Available Liquidity"
        value={formatSmartNumber(metrics.totalBalance)}  
        subValue="Across all wallets"
        icon={WalletIcon}
        href="/dashboard/wallets"
        theme={{
            borderGradient: "from-blue-500/60",
            innerGradient: "from-blue-500/10 to-transparent",
            iconBg: "bg-blue-500/10",
            text: "text-blue-500",
            chartColor: "#3b82f6"
        }}
      />
      <StatCard 
        title="Total Saved" 
        subtitle="Secure Reserves"
        value={formatSmartNumber(metrics.totalSaved)} 
        subValue="In savings buckets"
        icon={PiggyBank}
        href="/dashboard/wallets"
        theme={{
            borderGradient: "from-amber-500/60",
            innerGradient: "from-amber-500/10 to-transparent",
            iconBg: "bg-amber-500/10",
            text: "text-amber-500",
            chartColor: "#f59e0b"
        }}
      />
      <StatCard 
        title="Active Rules" 
        subtitle="Automation Engine"
        value={metrics.activeRules.toString()} 
        subValue="Splits running"
        icon={Zap}
        href="/dashboard/rules"
        theme={{
            borderGradient: "from-pink-500/60",
            innerGradient: "from-pink-500/10 to-transparent",
            iconBg: "bg-pink-500/10",
            text: "text-pink-500",
            chartColor: "#ec4899"
        }}
      />
      
      {children && (
        <div className="block lg:hidden h-[140px] rounded-2xl p-[1px] bg-gradient-to-br from-green-500/50 via-transparent to-transparent">
          <Card className="h-full p-3 flex flex-col justify-between overflow-hidden relative border-none bg-card rounded-[15px]">
             <div className="flex justify-between items-center mb-1 relative z-10">
                <span className="text-[10px] font-medium text-muted-foreground">Cash Flow</span>
                <span className="text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20">+12%</span>
             </div>
             {children}
          </Card>
        </div>
      )}
    </div>
  );
}