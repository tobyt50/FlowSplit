'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Transaction, TransactionType } from '@flowsplit/prisma';
import { formatCurrency } from '../../../../lib/walletService';
import { ArrowDownLeft, ArrowUpRight, ArrowRightLeft, History, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { ScrollArea } from '../../../../components/ui/ScrollArea';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const router = useRouter();

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case 'CREDIT': return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'DEBIT': return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      default: return <ArrowRightLeft className="h-4 w-4 text-blue-500" />;
    }
  };

  const getBgColor = (type: TransactionType) => {
    switch (type) {
        case 'CREDIT': return 'bg-green-500/10 border-green-500/20';
        case 'DEBIT': return 'bg-red-500/10 border-red-500/20';
        default: return 'bg-blue-500/10 border-blue-500/20';
      }
  };

  if (transactions.length === 0) {
      return (
        <Card className="h-full flex flex-col items-center justify-center text-center p-6 bg-card border-border min-h-[300px]">
            <div className="h-14 w-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <History className="h-7 w-7 text-muted-foreground opacity-50" />
            </div>
            <p className="text-muted-foreground text-sm font-medium">No transaction history yet.</p>
        </Card>
      );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden bg-card border-border min-h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5 shrink-0">
        <CardTitle className="text-lg">Recent Data</CardTitle>
      </CardHeader>

      <div className="flex-1 min-h-0 relative">
        <ScrollArea className="h-full w-full">
            <div className="px-4 pb-2 space-y-1">
                {transactions.slice(0, 10).map((tx) => (
                <Link 
                  href={`/dashboard/transactions/${tx.id}`} 
                  key={tx.id} 
                  className="block group"
                >
                    {/* 
                       Using CSS Grid instead of Flexbox here.
                       grid-cols-[1fr_auto]: Left side takes available space, Right side takes what it needs.
                       items-center: Ensures vertical centering.
                    */}
                    <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-2.5 rounded-xl transition-all hover:bg-muted/40 border border-transparent hover:border-border/50">
                        
                        {/* LEFT: Icon + Text (Truncates if too long) */}
                        <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${getBgColor(tx.type)}`}>
                                {getIcon(tx.type)}
                            </div>
                            
                            <div className="flex flex-col justify-center overflow-hidden">
                                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                    {tx.description || (tx.type === 'CREDIT' ? 'Incoming Deposit' : 'Outgoing Payment')}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {new Date(tx.initiatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: Amount + Status (Always visible, aligned right) */}
                        <div className="text-right whitespace-nowrap">
                            <div className={`text-sm font-bold ${tx.type === 'DEBIT' ? 'text-foreground' : 'text-green-500'}`}>
                                {tx.type === 'DEBIT' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
                            </div>
                            <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold bg-muted/30 px-1.5 py-0.5 rounded-md inline-block mt-1">
                                {tx.status}
                            </div>
                        </div>
                    </div>
                </Link>
                ))}
            </div>
        </ScrollArea>
      </div>
      
      {/* Footer Link */}
      <div className="p-4 pt-2 mt-auto border-t border-border">
        <Button
            className="w-full h-9 text-xs"
            variant="outline" 
            onClick={() => router.push('/dashboard/transactions')}
        >
            Show all history <ArrowRight className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      </div>
    </Card>
  );
}