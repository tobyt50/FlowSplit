'use client';

import React from 'react';
import { Wallet, SplitRule, SplitType } from '@flowsplit/prisma';
import { formatCurrency } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { ArrowLeft, PlusCircle, History, Layers } from 'lucide-react';

interface WalletDetailViewProps {
  wallet: Wallet;
  rules: SplitRule[];
  onBack: () => void;
}

export function WalletDetailView({ wallet, rules, onBack }: WalletDetailViewProps) {
  
  const formatRuleValue = (rule: SplitRule): string => {
    if (rule.type === SplitType.FIXED) {
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    return `${rule.value}%`;
  };

  return (
    <div className="flex flex-col h-full bg-card rounded-2xl relative overflow-hidden">
      {/* Subtle background flair */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-3/4 bg-primary/5 blur-3xl pointer-events-none rounded-full"></div>

      {/* Header */}
      <div className="flex items-center p-4 border-b border-border z-10">
        <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 hover:bg-muted text-muted-foreground hover:text-foreground" 
            onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex flex-col">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Portfolio Asset</h3>
            <span className="text-lg font-bold text-foreground">{wallet.name}</span>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-grow p-6 flex flex-col z-10 overflow-y-auto">
        
        {/* Balance Section */}
        <div className="text-center py-6 mb-6">
          <p className="text-sm font-medium text-muted-foreground mb-2">Available Balance</p>
          <p className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-foreground/70">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>

        {/* Rules List */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
             <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" /> Active Sources
             </h4>
             <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                {rules.length} Rules
             </Badge>
          </div>

          <div className="space-y-2">
            {rules.length > 0 ? (
              rules.map(rule => (
                <div key={rule.id} className="flex justify-between items-center p-3 rounded-xl bg-muted/40 border border-border hover:bg-muted/60 transition-colors">
                  <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{rule.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">{rule.type} Split</span>
                  </div>
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                    {formatRuleValue(rule)}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 rounded-xl border border-dashed border-border bg-muted/20">
                <p className="text-sm text-muted-foreground">No active split rules funding this wallet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-border bg-muted/20 flex gap-3 z-10">
        <Button variant="outline" className="flex-1 border-border bg-background hover:bg-muted text-foreground" disabled>
            <History className="mr-2 h-4 w-4" /> History
        </Button>
        <Button className="flex-1" disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Top Up
        </Button>
      </div>
    </div>
  );
}