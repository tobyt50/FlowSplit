'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { SplitRule, Wallet, SplitType } from '@flowsplit/prisma';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Switch } from '../../../../components/ui/Switch';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { updateRule } from '../../../../lib/ruleService';
import { formatCurrency } from '../../../../lib/walletService';
import { toast } from 'sonner';
import { Zap, ArrowUpRight, SlidersHorizontal } from 'lucide-react';

interface ActiveRulesProps {
  rules: SplitRule[];
  wallets: Wallet[];
  onRuleToggle: () => void;
}

export function ActiveRules({ rules, wallets, onRuleToggle }: ActiveRulesProps) {
  const router = useRouter();
  const walletMap = useMemo(() => new Map(wallets.map(w => [w.id, w.name])), [wallets]);

  const handleToggle = async (ruleId: string, currentStatus: boolean) => {
    try {
      await updateRule(ruleId, { isActive: !currentStatus });
      toast.success(`Rule ${!currentStatus ? 'activated' : 'deactivated'}.`);
      onRuleToggle();
    } catch (error: any) {
      toast.error('Update Failed', { description: error.message });
    }
  };

  const formatRuleValue = (rule: SplitRule): string => {
    if (rule.type === SplitType.FIXED) {
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    return `${rule.value}%`;
  };

  const activeRules = rules
    .filter(rule => rule.isActive)
    .sort((a, b) => a.priority - b.priority);

  return (
    <Card className="flex flex-col h-full bg-card border-border">
      <CardHeader className="pb-3 pt-5 px-5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-foreground">Active Rules</CardTitle>
            <CardDescription>Rules active for next deposit.</CardDescription>
          </div>
          <Badge variant="outline" className="hidden md:flex bg-primary/10 text-primary border-primary/20 shrink-0">
            {activeRules.length} Active
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow space-y-3 px-5 pb-5 overflow-hidden">
        {activeRules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[120px] text-center p-4 border border-dashed border-border rounded-xl bg-muted/10">
            <SlidersHorizontal className="h-6 w-6 text-muted-foreground mb-2 opacity-50" />
            <p className="text-sm font-medium text-foreground">No active rules.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeRules.map((rule) => (
              <div 
                key={rule.id} 
                // Changed from bg-black/20 to bg-muted/30 for a lighter, "less dark" appearance
                className="group flex items-center justify-between gap-2 rounded-xl border border-border bg-muted/30 p-2.5 transition-all hover:border-primary/30 hover:bg-muted/50"
              >
                {/* Left: Icon & Name (Flexible width, will truncate) */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/10">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-none truncate pr-1">{rule.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate">
                      To: <span className="font-medium text-foreground/80 truncate">{walletMap.get(rule.destinationWalletId || '') || 'N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Right: Actions & Value (Fixed width, won't shrink) */}
                <div className="flex items-center gap-3 shrink-0">
                   <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-foreground">{formatRuleValue(rule)}</span>
                      <Badge variant="secondary" className="text-[9px] px-1 h-3.5 bg-background text-muted-foreground border border-border shadow-sm">{rule.type}</Badge>
                   </div>

                   <div className="flex items-center gap-1.5 pl-1 border-l border-border/50">
                       <Switch
                          checked={rule.isActive}
                          onCheckedChange={() => handleToggle(rule.id, rule.isActive)}
                          className="scale-75 origin-right"
                       />
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 pb-5 px-5 mt-auto">
        <Button 
            className="w-full h-9 text-xs" 
            variant="outline" 
            onClick={() => router.push('/dashboard/rules')}
        >
          Manage All Rules <ArrowUpRight className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </CardFooter>
    </Card>
  );
}