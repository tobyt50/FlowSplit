'use client';

import React, { useMemo, useState } from 'react';
import { Wallet, SplitRule, UnifiedTransaction } from '../../../../types/index';
import { ArrowUpRight, Wallet as WalletIcon, PiggyBank, Eye, EyeOff } from 'lucide-react';
import { Card } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { cn } from '../../../../lib/utils';
import Link from 'next/link';

interface OverviewCardsProps {
  data: {
    wallets: Wallet[];
    rules: SplitRule[];
    transactions: UnifiedTransaction[]; // Updated Type
  };
  children?: React.ReactNode; 
}

// --- SMART FORMATTER COMPONENT ---
// Renders: <Small Symbol> <Large Integer> <Small Kobo/Suffix>
const SmartCurrency = ({ amount, visible }: { amount: bigint; visible: boolean }) => {
  if (!visible) return <span className="text-muted-foreground/50 tracking-widest text-lg">₦∗∗∗∗∗</span>;

  const numericAmount = Number(amount) / 100;
  
  let mainPart = '';
  let secondaryPart = '';
  
  if (numericAmount >= 1_000_000_000) {
    // Billions: 1.5 B
    mainPart = (numericAmount / 1_000_000_000).toFixed(1);
    secondaryPart = 'B';
  } else if (numericAmount >= 1_000_000) {
    // Millions: 1.5 M
    mainPart = (numericAmount / 1_000_000).toFixed(1);
    secondaryPart = 'M';
  } else {
     // Standard: 1,234 .56
     const formattedTotal = new Intl.NumberFormat('en-US', { 
       minimumFractionDigits: 2, 
       maximumFractionDigits: 2 
     }).format(numericAmount);
     
     const parts = formattedTotal.split('.');
     mainPart = parts[0];
     secondaryPart = `.${parts[1]}`;
  }

  return (
    <span className="inline-flex items-baseline font-mono">
      {/* Symbol: Smaller & Muted */}
      <span className="text-lg md:text-2xl font-semibold text-muted-foreground/70 mr-1">₦</span>

      {/* Main Integer: Inherits Large Size from Parent */}
      <span className="text-foreground tracking-tight">{mainPart}</span>

      {/* Kobo/Suffix: Smaller & Muted (Same as Symbol) */}
      <span className="text-lg md:text-2xl font-semibold text-muted-foreground/70 ml-0.5">{secondaryPart}</span>
    </span>
  );
};

export function OverviewCards({ data, children }: OverviewCardsProps) {
  const { wallets, rules } = data;
  const [showBalances, setShowBalances] = useState(true);

  const metrics = useMemo(() => {
    const totalBalance = wallets.reduce((sum, wallet) => sum + BigInt(wallet.balance), 0n);
    const totalSaved = wallets
      .filter((w) => w.type === 'SAVINGS')
      .reduce((sum, wallet) => sum + BigInt(wallet.balance), 0n);
    const activeRules = rules.filter(r => r.isActive).length;

    return { totalBalance, totalSaved, activeRules, totalWallets: wallets.length };
  }, [wallets, rules]);

  // --- REUSABLE STAT CARD COMPONENT ---
  const StatCard = ({ title, value, subValue, subtitle, icon: Icon, theme, href, isFullWidth, showButton }: any) => (
    <div className={cn("group", isFullWidth && "col-span-2")}>
      <div 
        className={cn(
          "group relative rounded-2xl p-[1px] h-[140px] md:h-[180px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
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
            {isFullWidth ? (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); setShowBalances(!showBalances); }}>
                {showBalances ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
              </Button>
            ) : (
              <div className="hidden md:flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary cursor-pointer">
                <Link href={href} className="w-full h-full flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          {/* Value Section */}
          <div className="relative z-10 mt-1 md:mt-2">
            <p className="hidden md:block text-xs text-muted-foreground mb-1">Current Metric</p>
            <div className="flex items-end gap-2">
               {/* 
                  The font-size here applies to the INTEGER part of SmartCurrency.
                  The SmartCurrency component internally sets smaller sizes for Symbol/Kobo.
               */}
               <h3 className={cn(
                  "font-bold text-foreground tracking-tighter transform scale-y-110 origin-bottom-left md:transform-none md:tracking-tight truncate max-w-full",
                  isFullWidth ? "text-3xl md:text-4xl" : "text-2xl md:text-3xl"
               )}>
                  <SmartCurrency amount={value} visible={showBalances} />
               </h3>
            </div>
            <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* ADD MORE DETAILS to Total Balance Card */}
                  {isFullWidth ? (
                      <div className="flex items-center divide-x divide-border/50 text-xs text-muted-foreground">
                        <span className="pr-2">{metrics.totalWallets} Wallets</span>
                        <span className="px-2">{metrics.activeRules} Active Rules</span>
                      </div>
                  ) : (
                    <>
                      <div className="flex items-center text-green-500 bg-green-500/10 px-1 py-0.5 md:px-1.5 rounded text-[9px] md:text-[10px] font-bold border border-green-500/20">
                          <ArrowUpRight className="h-2.5 w-2.5 mr-1" />
                          Active
                      </div>
                      <span className="hidden md:inline text-xs text-muted-foreground">{subValue}</span>
                    </>
                  )}
                </div>
                {showButton && (
                  <Link href={href}>
                    <Button variant="secondary" size="sm" className="h-7 rounded-lg text-xs font-semibold">
                      View Wallets <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
            </div>
          </div>

          {/* Decorative Chart Line */}
          <div className="absolute bottom-0 left-0 right-0 h-12 md:h-16 opacity-[0.05] group-hover:opacity-10 transition-opacity pointer-events-none">
            <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="h-full w-full">
                <path d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5 V 20 H 0 Z" fill={theme.chartColor} />
                <path d="M0 15 Q 20 18, 40 10 T 80 12 T 100 5" fill="none" stroke={theme.chartColor} strokeWidth="0.5" />
            </svg>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-3">
      {/* --- Total Balance Card --- */}
      <StatCard 
        title="Total Balance" 
        subtitle="Available Liquidity"
        value={metrics.totalBalance} // Pass BigInt directly
        subValue="Across all wallets"
        icon={WalletIcon}
        href="/dashboard/wallets"
        isFullWidth={true}
        showButton={true}
        theme={{
            borderGradient: "from-blue-500/60",
            innerGradient: "from-blue-500/10 to-transparent",
            iconBg: "bg-blue-500/10",
            text: "text-blue-500",
            chartColor: "#3b82f6"
        }}
      />
      
      {/* --- MOBILE LAYOUT: Saved + CashFlow --- */}
      <div className="lg:hidden col-span-2 grid grid-cols-2 gap-3">
        {/* Total Saved Card */}
        <StatCard 
          title="Total Saved" 
          subtitle="Reserves"
          value={metrics.totalSaved} // Pass BigInt directly
          subValue="In savings"
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
        {/* Cash Flow card on Mobile */}
        {children && (
          <div className="h-[140px] rounded-2xl p-[1px] bg-gradient-to-br from-green-500/50 via-transparent to-transparent">
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

      {/* --- DESKTOP LAYOUT: Saved --- */}
      <div className="hidden lg:block">
        <StatCard 
          title="Total Saved" 
          subtitle="Secure Reserves"
          value={metrics.totalSaved} // Pass BigInt directly
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
      </div>
      
    </div>
  );
}