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
      <div className="flex flex-col items-center justify-center h-[240px] text-center p-6 rounded-2xl bg-card border border-border shadow-sm">
        <div className="p-3 rounded-full bg-muted mb-3">
             <Hourglass className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">Awaiting Deposit</p>
        <p className="text-xs text-muted-foreground mt-2 max-w-[180px]">
          Add funds to see your automated split in action.
        </p>
      </div>
    );
  }

  const { depositAmount, depositDate, allocations } = data;
  const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.amount, 0n);

  return (
    <div className="relative flex flex-col h-[240px] rounded-2xl bg-card border border-border p-5 shadow-sm overflow-hidden">
      {/* Background Gradient Effect */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 h-32 w-32 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between mb-4 z-10">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Last Split</h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {new Date(depositDate).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
           <CheckCircle2 className="h-3 w-3" />
           <span className="text-[10px] font-bold uppercase">Success</span>
        </div>
      </div>

      {/* Main Amount */}
      <div className="mb-5 z-10">
        <span className="text-2xl font-bold text-foreground tracking-tight block">{formatCurrency(depositAmount)}</span>
      </div>

      {/* Allocations List (Scrollable if needed) */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1 z-10 custom-scrollbar max-h-[200px]">
        {allocations.map((alloc) => {
             const percent = totalAllocated > 0n ? Number((alloc.amount * 100n) / totalAllocated) : 0;
             return (
                <div key={alloc.walletId} className="group">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-muted-foreground font-medium flex items-center gap-2 truncate max-w-[60%]">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></div>
                            {alloc.walletName}
                        </span>
                        <span className="text-foreground font-mono">{formatCurrency(alloc.amount)}</span>
                    </div>
                    {/* Micro bar */}
                    <div className="w-full bg-muted rounded-full h-1">
                        <div 
                            className="bg-primary/40 group-hover:bg-primary transition-colors h-1 rounded-full" 
                            style={{ width: `${percent}%` }}
                        ></div>
                    </div>
                </div>
             );
        })}
      </div>
    </div>
  );
}