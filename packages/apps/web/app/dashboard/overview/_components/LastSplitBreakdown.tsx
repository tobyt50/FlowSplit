'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/Card';
import { formatCurrency } from '../../../../lib/walletService';
import { LastSplitBreakdown as LastSplitBreakdownData } from '../../../../lib/dashboardService';
import { Separator } from '../../../../components/ui/Separator';
import { ArrowRight, Hourglass } from 'lucide-react';

interface LastSplitBreakdownProps {
  data: LastSplitBreakdownData | null;
}

export function LastSplitBreakdown({ data }: LastSplitBreakdownProps) {
  // --- RENDER THE "WAITING" STATE ---
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Last Split Breakdown</CardTitle>
          <CardDescription>A summary of your most recent automatic split.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[200px] text-center rounded-lg border border-dashed p-4">
            <Hourglass className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-semibold">Waiting for your first deposit</p>
            <p className="text-sm text-muted-foreground">
              Once you add funds, this area will show you exactly how your money was allocated.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { depositAmount, depositDate, allocations } = data;
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0n);

  // --- RENDER THE DETAILED BREAKDOWN ---
  return (
    <Card>
      <CardHeader>
        <CardTitle>Last Split Breakdown</CardTitle>
        <CardDescription>
          Your deposit of {formatCurrency(depositAmount)} on {new Date(depositDate).toLocaleDateString()} was allocated as follows:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {allocations.map(alloc => (
          <div key={alloc.walletId}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-muted-foreground">{alloc.walletName}</span>
              <span className="font-mono">{formatCurrency(alloc.amount)}</span>
            </div>
            {/* Visual stacked bar */}
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full" 
                style={{ width: `${Number((alloc.amount * 100n) / totalAllocated)}%` }}
              ></div>
            </div>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-bold text-sm">
            <span>Total Allocated</span>
            <span>{formatCurrency(totalAllocated)}</span>
        </div>
      </CardContent>
    </Card>
  );
}