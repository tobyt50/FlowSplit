'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Progress } from '../../../../components/ui/Progress';
import { Badge } from '../../../../components/ui/Badge';
import { formatCurrency } from '../../../../lib/walletService';
import { Activity, Shield } from 'lucide-react';
import api from '../../../../lib/api';
import { API_URLS } from '../../../../lib/config';

interface LimitStatus {
  tier: string;
  daily: { limit: string; used: string; remaining: string };
  monthly: { limit: string; used: string; remaining: string };
}

export function LimitsCard() {
  const [status, setStatus] = useState<LimitStatus | null>(null);

  useEffect(() => {
    api.get<LimitStatus>(`${API_URLS.MONOLITH}/limits/status`)
       .then(res => setStatus(res.data))
       .catch(console.error);
  }, []);

  if (!status) return null;

  // Calculate Percentage
  const dailyLimit = BigInt(status.daily.limit);
  const dailyUsed = BigInt(status.daily.used);
  
  // Handle Unlimited (-1)
  const isUnlimited = dailyLimit === -1n;
  const percentage = isUnlimited ? 0 : Number((dailyUsed * 100n) / dailyLimit);

  // Determine color based on usage
  const isHighUsage = percentage > 90;

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                <Activity className="h-4 w-4" />
            </div>
            <CardTitle className="text-md font-medium text-foreground">Transaction Limits</CardTitle>
        </div>
        <Badge variant="outline" className="bg-background text-[10px] uppercase tracking-wider font-bold px-2 h-5">
            {status.tier}
        </Badge>
      </CardHeader>
      
      <CardContent className="pt-4 space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-end text-xs">
            <span className="text-muted-foreground font-medium">Daily Usage</span>
            <div className="text-right">
                <span className={`font-mono font-semibold ${isHighUsage ? 'text-destructive' : 'text-foreground'}`}>
                    {formatCurrency(status.daily.used)}
                </span>
                <span className="text-muted-foreground mx-1">/</span>
                <span className="text-muted-foreground">
                    {isUnlimited ? '∞' : formatCurrency(status.daily.limit)}
                </span>
            </div>
          </div>
          
          {!isUnlimited && (
            <div className="relative">
                <Progress 
                    value={percentage} 
                    className={`h-2 bg-muted/50 ${isHighUsage ? "[&>div]:bg-destructive" : ""}`} 
                />
            </div>
          )}

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/20 p-2 rounded-lg">
             <Shield className="h-3 w-3 opacity-50" />
             <span className="truncate">
                 {isUnlimited 
                    ? "No limits applied." 
                    : `${formatCurrency(status.daily.remaining)} remaining today.`}
             </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}