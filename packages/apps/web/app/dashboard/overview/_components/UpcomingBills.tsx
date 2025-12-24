'use client';

import React from 'react';
import { Card } from '../../../../components/ui/Card';
import { Progress } from '../../../../components/ui/Progress';
import { formatCurrency } from '../../../../lib/walletService';
import { CalendarClock, CheckCircle2 } from 'lucide-react';

export interface UpcomingBill {
  ruleId: string;
  name: string;
  estimatedAmount: bigint;
  daysUntilDue: number;
  walletName: string;
  walletBalance: bigint;
}

interface UpcomingBillsProps {
  bills: UpcomingBill[];
}

export function UpcomingBills({ bills }: UpcomingBillsProps) {
  if (bills.length === 0) {
    return (
      <Card className="h-full flex flex-col items-center justify-center text-center p-6 border-dashed bg-muted/10">
         <div className="p-3 bg-green-500/10 rounded-full mb-3">
            <CheckCircle2 className="h-6 w-6 text-green-500" />
         </div>
         <p className="font-medium text-foreground">All caught up!</p>
         <p className="text-sm text-muted-foreground">No upcoming bills for this cycle.</p>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <div className="p-5 border-b border-border bg-muted/20">
         <h3 className="font-semibold text-md text-foreground flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            Upcoming Bills
         </h3>
      </div>
      <div className="p-5 space-y-5 flex-1 overflow-y-auto">
        {bills.slice(0, 4).map((bill) => {
          const fundedPercentage = bill.estimatedAmount > 0n
            ? Math.min(100, Number((bill.walletBalance * 100n) / bill.estimatedAmount))
            : 100;
          
          const isFunded = fundedPercentage >= 100;

          return (
            <div key={bill.ruleId} className="group">
              <div className="flex justify-between text-sm mb-2">
                <div>
                    <span className="font-medium text-foreground block">{bill.name}</span>
                    <span className="text-xs text-muted-foreground font-medium text-amber-500">Due in {bill.daysUntilDue} days</span>
                </div>
                <div className="text-right">
                    <span className="block font-mono font-medium text-foreground">{formatCurrency(bill.estimatedAmount)}</span>
                    <span className={`text-[10px] uppercase font-bold ${isFunded ? 'text-green-500' : 'text-blue-500'}`}>
                        {isFunded ? 'Ready' : 'Funding'}
                    </span>
                </div>
              </div>
              
              <Progress 
                value={fundedPercentage} 
                className="h-1.5 bg-muted" 
              />
              
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                <span>{fundedPercentage}% saved</span>
                <span>Source: {bill.walletName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}