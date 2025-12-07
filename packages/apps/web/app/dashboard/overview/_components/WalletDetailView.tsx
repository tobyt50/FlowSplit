'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, SplitRule } from '../../../../types/index';
import { SplitTypes, WalletTypes } from '../../../../lib/enums';
import { formatCurrency } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { Progress } from '../../../../components/ui/Progress';
import { ArrowLeft, PlusCircle, History, Layers, Target, TrendingUp } from 'lucide-react';

interface WalletDetailViewProps {
  wallet: Wallet;
  rules: SplitRule[];
  onBack: () => void;
}

export function WalletDetailView({ wallet, rules, onBack }: WalletDetailViewProps) {
  const router = useRouter();
  
  const formatRuleValue = (rule: SplitRule): string => {
    if (rule.type === SplitTypes.FIXED) {
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    return `${rule.value}%`;
  };

  // Calculate Progress if target is set
  const balance = Number(wallet.balance);
  const target = Number(wallet.targetAmount);
  const progress = target > 0 ? Math.min(100, (balance / target) * 100) : 0;
  const isSavings = wallet.type === WalletTypes.SAVINGS;

  // Navigation handlers
  const navigateToDetails = () => router.push(`/dashboard/wallets/${wallet.id}`);

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
      {/* Dynamic Background Flair based on Wallet Type */}
      <div className={`absolute top-0 left-1/2 -translate-x-1/2 h-32 w-3/4 blur-3xl pointer-events-none rounded-full opacity-40 ${isSavings ? 'bg-blue-500/20' : 'bg-primary/20'}`}></div>

      {/* Header */}
      <div className="flex items-center p-4 border-b border-border z-10 bg-card/50 backdrop-blur-sm">
        <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" 
            onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{wallet.type} WALLET</h3>
            <span className="text-lg font-bold text-foreground leading-none">{wallet.name}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow p-6 flex flex-col z-10 overflow-y-auto">
        
        {/* Balance Section */}
        <div className="text-center py-4 mb-4">
          <p className="text-sm font-medium text-muted-foreground mb-1">Available Balance</p>
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>

        {/* Target / Goal Section (Conditional) */}
        {target > 0 && (
          <div className="mb-6 bg-muted/30 p-3 rounded-lg border border-border/50">
            <div className="flex justify-between items-center text-xs mb-2">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {isSavings ? <Target className="h-3.5 w-3.5 text-blue-500" /> : <TrendingUp className="h-3.5 w-3.5 text-amber-500" />}
                {isSavings ? 'Savings Goal' : 'Monthly Budget'}
              </span>
              <span className="text-muted-foreground">{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
              <span>{formatCurrency(0n)}</span>
              <span>{formatCurrency(wallet.targetAmount)}</span>
            </div>
          </div>
        )}

        {/* Rules List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
             <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5 uppercase tracking-wide opacity-80">
                <Layers className="h-3.5 w-3.5" /> Funding Sources
             </h4>
             <Badge variant="secondary" className="text-[10px] px-1.5 h-5">
                {rules.length} Active
             </Badge>
          </div>

          <div className="space-y-2">
            {rules.length > 0 ? (
              rules.map(rule => (
                <div key={rule.id} className="flex justify-between items-center p-3 rounded-lg bg-card border border-border shadow-sm">
                  <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{rule.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{rule.type} Allocation</span>
                  </div>
                  <Badge variant="outline" className="bg-background font-mono">
                    {formatRuleValue(rule)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-6 rounded-lg border border-dashed border-border/60 bg-muted/10">
                <p className="text-xs text-muted-foreground">No active split rules funding this wallet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-muted/10 flex gap-3 z-10">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={navigateToDetails}
        >
            <History className="mr-2 h-4 w-4" /> History
        </Button>
        <Button 
          className="flex-1 shadow-sm"
          onClick={navigateToDetails}
        >
            <PlusCircle className="mr-2 h-4 w-4" /> Manage
        </Button>
      </div>
    </div>
  );
}