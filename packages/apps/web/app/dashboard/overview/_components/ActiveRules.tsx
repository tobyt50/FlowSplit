'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SplitRule, Wallet, SplitType } from '@flowsplit/prisma'; // 1. Import SplitType
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../../../../components/ui/Card';
import { Switch } from '../../../../components/ui/Switch';
import { Button } from '../../../../components/ui/Button';
import { updateRule } from '../../../../lib/ruleService';
import { formatCurrency } from '../../../../lib/walletService'; // 2. Import the currency formatter
import { toast } from 'sonner';

interface ActiveRulesProps {
  rules: SplitRule[];
  wallets: Wallet[];
  onRuleToggle: () => void; // A callback to refresh data on the parent page
}

export function ActiveRules({ rules, wallets, onRuleToggle }: ActiveRulesProps) {
  const router = useRouter();
  const walletMap = new Map(wallets.map(w => [w.id, w.name]));

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    try {
      await updateRule(ruleId, { isActive: !currentStatus });
      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}.`);
      onRuleToggle(); // Trigger data refresh
    } catch (error: any) {
      toast.error('Update Failed', { description: error.message });
    }
  };

  /**
   * 3. A new helper function to format the rule's value based on its type.
   * This is the core of the "smarter" component logic.
   */
  const formatRuleValue = (rule: SplitRule): string => {
    if (rule.type === SplitType.FIXED) {
      // For FIXED rules, format the kobo value as a currency string (e.g., ₦50,000.00)
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    // For PERCENTAGE rules, format it as a percentage string (e.g., 30%)
    return `${rule.value}%`;
  };

  return (
    <Card className="flex flex-col h-full"> {/* Added flex classes for better layout */}
      <CardHeader>
        <CardTitle>Active Split Rules</CardTitle>
        <CardDescription>
          Toggle your rules on or off for the next deposit.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow"> {/* Added flex-grow */}
        {rules.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center text-sm text-muted-foreground">
            No split rules created yet.
          </div>
        ) : (
          <div className="space-y-4">
            {/* 4. Display only active rules for a cleaner UI, sorted by priority */}
            {rules
              .filter(rule => rule.isActive)
              .sort((a, b) => a.priority - b.priority)
              .map((rule) => (
                <div key={rule.id} className="flex items-center">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{rule.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {/* 5. Use the new formatting function */}
                      <span className="font-semibold">{formatRuleValue(rule)}</span> → {walletMap.get(rule.destinationWalletId || '') || 'N/A'}
                    </p>
                  </div>
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                  />
                </div>
              ))}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant="outline" onClick={() => router.push('/dashboard/rules')}>
          Manage All Rules
        </Button>
      </CardFooter>
    </Card>
  );
}