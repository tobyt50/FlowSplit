'use client';

import React from 'react';
import { LastSplitBreakdown as LastSplitBreakdownData } from '../../../../lib/dashboardService';
import { formatCurrency } from '../../../../lib/walletService';
import { CheckCircle2, Hourglass } from 'lucide-react';

interface LastSplitBreakdownProps {
  data: LastSplitBreakdownData | null;
}

export function LastSplitBreakdown({ data }: LastSplitBreakdownProps) {
  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-center p-6 rounded-2xl bg-card border border-border">
        <div className="p-3 rounded-full bg-muted mb-3">
             <Hourglass className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">Waiting for first deposit</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
          Once you add funds, this area will show you exactly how your money was allocated.
        </p>
      </div>
    );
  }

  const { depositAmount, depositDate, allocations } = data;
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0n);

  const splitPercentage = depositAmount > 0n 
    ? Number((totalAllocated * 100n) / depositAmount) 
    : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-5">
      {/* Background Gradient Effect - Made subtle for light mode compatibility */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Last Split Breakdown</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date(depositDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-green-500">
           <CheckCircle2 className="h-3 w-3" />
           <span className="text-[10px] font-bold uppercase tracking-wide">Success</span>
        </div>
      </div>

      {/* Main Amount */}
      <div className="mb-6">
        <span className="text-2xl font-bold text-foreground tracking-tight">{formatCurrency(depositAmount)}</span>
        <span className="text-xs text-muted-foreground ml-2">Total Deposit</span>
      </div>

      {/* Global Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Allocation Rate</span>
            <span className="text-foreground font-mono">{splitPercentage}%</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div 
                className="h-full bg-primary rounded-full" 
                style={{ width: `${splitPercentage}%` }}
            ></div>
        </div>
      </div>

      {/* Allocations List */}
      <div className="space-y-3">
        {allocations.map((alloc) => {
             const percent = totalAllocated > 0n ? Number((alloc.amount * 100n) / totalAllocated) : 0;
             return (
                <div key={alloc.walletId} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                            {alloc.walletName}
                        </span>
                        <span className="text-foreground font-mono">{formatCurrency(alloc.amount)}</span>
                    </div>
                    {/* Micro bar */}
                    <div className="w-full bg-muted rounded-full h-1">
                        <div 
                            className="bg-muted-foreground/30 group-hover:bg-primary transition-colors h-1 rounded-full" 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
             );
        })}
      </div>
      
      {/* Footer Total */}
      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center">
          <span className="text-xs text-muted-foreground font-medium">Total Allocated</span>
          <span className="text-sm font-bold text-foreground">{formatCurrency(totalAllocated)}</span>
      </div>
    </div>
  );
}