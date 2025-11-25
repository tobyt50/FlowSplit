'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Sparkles, TrendingUp, AlertTriangle, PiggyBank, ArrowRight } from 'lucide-react';
import { AIInsight } from '../../../../lib/aiService';

interface InsightCardProps {
  insight: AIInsight | null;
}

export function InsightCard({ insight }: InsightCardProps) {
  const router = useRouter();

  if (!insight || insight.insightCode === 'DEFAULT_GREETING') {
    return null; // Don't show the card if everything is perfect
  }

  // Determine Icon and Color based on the type of insight
  let Icon = Sparkles;
  let colorClass = "text-primary"; // Default Teal
  let bgClass = "bg-primary/10";

  switch (insight.insightCode) {
    case 'UNALLOCATED_FUNDS':
      Icon = AlertTriangle;
      colorClass = "text-amber-500";
      bgClass = "bg-amber-500/10";
      break;
    case 'LOW_SAVINGS_RATE':
      Icon = PiggyBank;
      colorClass = "text-blue-500";
      bgClass = "bg-blue-500/10";
      break;
    case 'HIGH_SPENDING_VELOCITY':
      Icon = TrendingUp;
      colorClass = "text-red-500";
      bgClass = "bg-red-500/10";
      break;
  }

  // Map the actionText to actual frontend logic
  const handleAction = () => {
    switch (insight.insightCode) {
      case 'UNALLOCATED_FUNDS':
        // Ideally opens a "Transfer" modal. For V1, we send them to Wallets.
        router.push('/dashboard/wallets'); 
        break;
      case 'LOW_SAVINGS_RATE':
      case 'NEW_SUBSCRIPTION_DETECTED':
        // Send them to the Rules page to fix their allocation
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
    <Card className="border-l-4 border-l-primary relative overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className={`p-2 rounded-full ${bgClass}`}>
          <Icon className={`h-6 w-6 ${colorClass}`} />
        </div>
        <div>
          <CardTitle className="text-lg">{insight.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm mb-4">
          {insight.description}
        </p>
        {insight.actionText && (
          <Button onClick={handleAction} size="sm" className="w-full sm:w-auto">
            {insight.actionText} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}