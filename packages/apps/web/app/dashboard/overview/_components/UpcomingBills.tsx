'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Progress } from '../../../../components/ui/Progress';
import { formatCurrency } from '../../../../lib/walletService';

// This type should be in a shared location, but for now, it's here
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
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
          <CardDescription>Your scheduled financial obligations will appear here.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
            <div className="flex h-[150px] items-center justify-center rounded-lg border border-dashed">
                <p className="text-sm text-muted-foreground">No upcoming bills this cycle.</p>
            </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Bills</CardTitle>
        <CardDescription>An estimate of your financial obligations for the rest of this month.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {bills.slice(0, 3).map((bill) => {
          const fundedPercentage = bill.estimatedAmount > 0n
            ? Math.min(100, Number((bill.walletBalance * 100n) / bill.estimatedAmount))
            : 100;

          return (
            <div key={bill.ruleId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium">{bill.name}</span>
                <span className="text-muted-foreground">
                  {formatCurrency(bill.estimatedAmount)}
                </span>
              </div>
              <Progress value={fundedPercentage} />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{fundedPercentage}% funded from "{bill.walletName}"</span>
                <span>Due in {bill.daysUntilDue} days</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}