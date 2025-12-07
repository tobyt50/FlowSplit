'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../../../../components/ui/Button';
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, ArrowRight, Lightbulb, Zap, CheckCircle2 } from 'lucide-react';
import { AIInsight } from '../../../../types/index';
import { AnimatePresence, motion } from 'framer-motion';

interface InsightCardProps {
  insight: AIInsight | null;
  onActionClick?: () => void;
}

// A curated list of evergreen financial tips for the "All Systems Go" mode
const smartTips = [
  {
    Icon: Lightbulb,
    title: 'Financial Tip',
    description: 'Review your split rules quarterly. As your income or goals change, your automation should adapt.',
  },
  {
    Icon: Zap,
    title: 'Did you know?',
    description: 'Creating a "Miscellaneous" wallet with a small percentage can help you handle unexpected small expenses without derailing your budget.',
  },
  {
    Icon: CheckCircle2,
    title: 'You are on the right track!',
    description: 'Consistent automation is the key to building long-term wealth. Keep it up!',
  },
  {
    Icon: PiggyBank,
    title: 'Level Up Your Savings',
    description: 'Consider creating a new "High-Yield Savings" wallet for your long-term goals and set a more aggressive savings rule.',
  }
];

export function InsightCard({ insight, onActionClick }: InsightCardProps) {
  const router = useRouter();
  const [activeTipIndex, setActiveTipIndex] = useState(0);
  
  const isAllSystemsGo = !insight || insight.insightCode === 'DEFAULT_GREETING';

  // Autoplay carousel logic for "All Systems Go"
  useEffect(() => {
    if (isAllSystemsGo) {
      const interval = setInterval(() => {
        setActiveTipIndex((prevIndex) => (prevIndex + 1) % smartTips.length);
      }, 7000); // Change tip every 7 seconds
      return () => clearInterval(interval);
    }
  }, [isAllSystemsGo]);
  
  if (!insight) {
    return null; // Don't render anything if insight is still loading
  }

  // --- "ALL SYSTEMS GO" (DEFAULT_GREETING) RENDER ---
  if (isAllSystemsGo) {
    const activeTip = smartTips[activeTipIndex];

    return (
      <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm`}>
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-50 pointer-events-none" />
        
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTipIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-xl bg-green-500/10 text-green-500 shadow-sm`}>
                  <activeTip.Icon className="h-5 w-5" />
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider opacity-80 text-green-500`}>
                  {activeTip.title}
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed min-h-[40px]">
                {activeTip.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- ACTIONABLE INSIGHT RENDER ---
  
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
      Icon = Sparkles;
      gradientClass = "from-primary/10 to-transparent";
      iconBgClass = "bg-primary/10 text-primary";
      break;
  }

  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
      return;
    }
    // Fallback routing
    switch (insight.insightCode) {
      case 'UNALLOCATED_FUNDS': router.push('/dashboard/wallets'); break;
      case 'LOW_SAVINGS_RATE':
      case 'NEW_SUBSCRIPTION_DETECTED': router.push('/dashboard/rules'); break;
      case 'HIGH_SPENDING_VELOCITY': router.push('/dashboard/transactions'); break;
      default: break;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass} opacity-50 pointer-events-none`} />
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