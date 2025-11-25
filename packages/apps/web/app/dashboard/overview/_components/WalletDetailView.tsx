'use client';

import React from 'react';
import { Wallet, SplitRule, SplitType } from '@flowsplit/prisma'; // 1. Import SplitType
import { formatCurrency } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Separator } from '../../../../components/ui/Separator';
import { Badge } from '../../../../components/ui/Badge';
import { ArrowLeft, PlusCircle, History } from 'lucide-react';

interface WalletDetailViewProps {
  wallet: Wallet;
  rules: SplitRule[]; // The rules that fund this wallet
  onBack: () => void; // A callback to return to the main chart view
}

export function WalletDetailView({ wallet, rules, onBack }: WalletDetailViewProps) {
  /**
   * 2. A new helper function to format the rule's value based on its type.
   * This logic is now consistent with the ActiveRules component.
   */
  const formatRuleValue = (rule: SplitRule): string => {
    if (rule.type === SplitType.FIXED) {
      // For FIXED rules, format the kobo value as a currency string
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    // For PERCENTAGE rules, format it as a percentage string
    return `${rule.value}%`;
  };

  return (
    <div className="flex flex-col h-full p-4">
      <div className="flex items-center mb-4">
        <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">{wallet.name}</h3>
      </div>
      
      <Separator />

      <div className="flex-grow py-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Current Balance</p>
          <p className="text-4xl font-bold tracking-tight">
            {formatCurrency(wallet.balance, wallet.currency)}
          </p>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Funding Rules</h4>
          {rules.length > 0 ? (
            <div className="space-y-2">
              {rules.map(rule => (
                <div key={rule.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                  <span>{rule.name}</span>
                  {/* 3. Use the new formatting function to display the correct value */}
                  <Badge variant="secondary">{formatRuleValue(rule)}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              This wallet is not funded by any active split rules.
            </p>
          )}
        </div>
      </div>

      <Separator />

      <div className="flex justify-end gap-2 pt-4">
        {/* These buttons are currently placeholders for future functionality */}
        <Button variant="outline" disabled>
            <History className="mr-2 h-4 w-4" /> View History
        </Button>
        <Button disabled>
            <PlusCircle className="mr-2 h-4 w-4" /> Top Up
        </Button>
      </div>
    </div>
  );
}