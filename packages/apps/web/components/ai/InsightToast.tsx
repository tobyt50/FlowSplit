'use client';

import React from 'react';
import { Button } from '../../components/ui/Button';
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, ArrowRight, X } from 'lucide-react';
import { AIInsight } from '../../types/index';
import { cn } from '../../lib/utils';

interface InsightToastProps {
  insight: AIInsight;
  onAction: () => void;
  onClose: () => void;
}

export function InsightToast({ insight, onAction, onClose }: InsightToastProps) {
  
  let Icon = Sparkles;
  let colorClass = "text-primary";
  let bgClass = "bg-primary/20";
  let borderClass = "border-l-red";

  switch (insight.insightCode) {
    case 'UNALLOCATED_FUNDS':
      Icon = AlertTriangle;
      colorClass = "text-amber-500";
      bgClass = "bg-amber-500/20";
      borderClass = "border-l-amber-500";
      break;
    case 'LOW_SAVINGS_RATE':
      Icon = PiggyBank;
      colorClass = "text-blue-500";
      bgClass = "bg-blue-500/20";
      borderClass = "border-l-blue-500";
      break;
    case 'HIGH_SPENDING_VELOCITY':
      Icon = TrendingUp;
      colorClass = "text-red-500";
      bgClass = "bg-red-500/20";
      borderClass = "border-l-red-500";
      break;
  }

  return (
    <div className={cn(
      "relative w-full max-w-[360px] overflow-hidden rounded-2xl",
      // Base (Light Mode)
      "bg-white border border-border shadow-xl",
      // Dark Mode Overrides
      "dark:bg-gradient-to-br dark:from-slate-900 dark:via-[#0F172A] dark:to-black", 
      "dark:border-white/10", 
      "dark:shadow-black/60",
      "p-5 cursor-default pointer-events-auto",
      "border-l-[6px]",
      borderClass,
    )}>
      {/* Glossy sheen overlay - Only in dark mode */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 dark:opacity-30 pointer-events-none" />

      {/* Close Button */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-3 right-3 p-1.5 transition-colors rounded-full z-20 
        text-muted-foreground hover:text-foreground hover:bg-muted
        dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Layout */}
      <div className="relative z-10 flex items-start gap-4">
        <div className={cn("p-2.5 rounded-xl shadow-inner shrink-0", bgClass, colorClass)}>
          <Icon className="h-5 w-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className={cn("text-[10px] font-bold uppercase tracking-widest", colorClass)}>
              AI Insight
            </span>
          </div>
          
          <h4 className="font-semibold text-sm leading-tight text-foreground dark:text-white">
            {insight.title}
          </h4>
          
          <p className="text-xs leading-relaxed mt-1.5 line-clamp-3 text-muted-foreground dark:text-slate-400">
            {insight.description}
          </p>

          {/* Action Button */}
          {insight.actionText && (
            <div className="pt-4">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onAction();
                  onClose();
                }} 
                size="sm" 
                className="w-auto h-9 rounded-xl text-xs font-semibold shadow-md"
              >
                {insight.actionText} <ArrowRight className="ml-2 h-3.5 w-3.5 opacity-70" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}