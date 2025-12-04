'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, ArrowRight } from 'lucide-react';
import { AIInsight } from '../../../../lib/aiService';

interface InsightCardProps {
  insight: AIInsight | null;
}

export function InsightCard({ insight }: InsightCardProps) {
  const router = useRouter();

  if (!insight || insight.insightCode === 'DEFAULT_GREETING') {
    return null;
  }

  // Determine Icon and Visual Theme based on insight type
  let Icon = Sparkles;
  let gradientClass = "from-primary/10 to-transparent";
  let iconBgClass = "bg-primary/10 text-primary";

  switch (insight.insightCode) {
    case 'UNALLOCATED_FUNDS':
      Icon = AlertTriangle;
      gradientClass = "from-amber-500/10 to-transparent";
      iconBgClass = "bg-amber-500/10 text-amber-500";
      break;
    case 'LOW_SAVINGS_RATE':
      Icon = PiggyBank;
      gradientClass = "from-blue-500/10 to-transparent";
      iconBgClass = "bg-blue-500/10 text-blue-500";
      break;
    case 'HIGH_SPENDING_VELOCITY':
      Icon = TrendingUp;
      gradientClass = "from-red-500/10 to-transparent";
      iconBgClass = "bg-red-500/10 text-red-500";
      break;
    default:
      // Default to the Sparkles look
      Icon = Sparkles;
      gradientClass = "from-primary/10 to-transparent";
      iconBgClass = "bg-primary/10 text-primary";
      break;
  }

  const handleAction = () => {
    switch (insight.insightCode) {
      case 'UNALLOCATED_FUNDS':
        router.push('/dashboard/wallets'); 
        break;
      case 'LOW_SAVINGS_RATE':
      case 'NEW_SUBSCRIPTION_DETECTED':
        router.push('/dashboard/rules');
        break;
      case 'HIGH_SPENDING_VELOCITY':
        router.push('/dashboard/transactions');
        break;
      default:
        break;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md`}>
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-50 pointer-events-none`} />

      {/* Decorative large icon in background */}
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Icon className="h-24 w-24 text-foreground" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-xl ${iconBgClass} shadow-sm`}>
            <Icon className="h-5 w-5" />
          </div>
          <span className={`text-xs font-bold uppercase tracking-wider opacity-80 ${iconBgClass.split(" ")[1]}`}>
            AI Insight
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          {insight.title}
        </h3>
        
        <p className="text-muted-foreground text-sm mb-5 max-w-xl leading-relaxed">
          {insight.description}
        </p>

        {insight.actionText && (
          <Button 
            onClick={handleAction} 
            size="sm" 
            className="rounded-xl shadow-lg shadow-black/5 dark:shadow-black/20"
          >
            {insight.actionText} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}