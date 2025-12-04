'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction, LedgerEntry } from '@flowsplit/prisma';
import { getTransactionById } from '../../../../lib/transactionService';
import { formatCurrency } from '../../../../lib/walletService';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { ArrowLeft, ArrowDown, Wallet, Hash, Calendar, CheckCircle2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '../../../../lib/utils';

// Extend the Transaction type to include ledger entries for the frontend
type TransactionWithLedger = Transaction & {
  ledgerTransaction?: {
    entries: (LedgerEntry & { wallet: { name: string } })[];
  };
};

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [transaction, setTransaction] = useState<TransactionWithLedger | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const txData = await getTransactionById(params.id);
        setTransaction(txData);
      } catch (error) {
        router.push('/dashboard/transactions');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTx();
  }, [params.id, router]);

  if (isLoading || !transaction) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
        Loading Details...
      </div>
    );
  }

  const creditEntries = transaction.ledgerTransaction?.entries.filter(e => e.type === 'CREDIT') || [];
  const debitEntry = transaction.ledgerTransaction?.entries.find(e => e.type === 'DEBIT');

  // Helper to render status badge
  const renderStatusBadge = (status: string) => {
    return (
        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1.5 px-2 py-0.5">
            <CheckCircle2 className="h-3 w-3" />
            <span className="uppercase tracking-wider text-[10px] font-bold">{status}</span>
        </Badge>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10 max-w-3xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="h-8 w-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-foreground">Transaction Details</h2>
      </div>
      
      {/* Main Card */}
      <Card className="overflow-hidden border-border bg-card">
        {/* Top Section: Amount & Description */}
        <CardHeader className="bg-muted/30 pb-6 pt-6 border-b border-border/50">
           <div className="flex flex-col items-center text-center gap-1">
              <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center mb-2 shadow-inner",
                  transaction.type === 'CREDIT' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
              )}>
                  {transaction.type === 'CREDIT' ? <ArrowDownLeft className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight text-foreground">
                 {formatCurrency(transaction.amount, transaction.currency)}
              </CardTitle>
              <CardDescription className="text-base font-medium text-muted-foreground">
                  {transaction.description || 'System Transaction'}
              </CardDescription>
              <div className="mt-2">
                 {renderStatusBadge(transaction.status)}
              </div>
           </div>
        </CardHeader>

        <CardContent className="p-0">
           {/* Metadata Grid */}
           <div className="grid grid-cols-2 gap-px bg-border/50">
              <div className="bg-card p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                     <Hash className="h-3 w-3" /> Reference
                  </span>
                  <span className="text-sm font-mono text-foreground break-all">{transaction.reference}</span>
              </div>
              <div className="bg-card p-4 flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                     <Calendar className="h-3 w-3" /> Date
                  </span>
                  <span className="text-sm text-foreground">{new Date(transaction.initiatedAt).toLocaleString()}</span>
              </div>
           </div>

           {/* Ledger Flow Visualization */}
           <div className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                 <Wallet className="h-4 w-4 text-primary" />
                 Money Flow
              </h3>

              <div className="relative pl-4 border-l-2 border-border/50 space-y-6 ml-2">
                  
                  {/* Source (Debit) */}
                  {debitEntry && (
                      <div className="relative">
                          <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-card bg-red-500"></div>
                          <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex justify-between items-center">
                              <div>
                                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">Source</p>
                                  <p className="text-sm font-semibold text-foreground">{debitEntry.wallet.name}</p>
                              </div>
                              <span className="font-mono text-sm font-medium text-red-500">
                                  -{formatCurrency(debitEntry.amount)}
                              </span>
                          </div>
                      </div>
                  )}

                  {/* Flow Arrow (Visual only) */}
                  {debitEntry && creditEntries.length > 0 && (
                      <div className="pl-4">
                          <ArrowDown className="h-4 w-4 text-muted-foreground/30" />
                      </div>
                  )}

                  {/* Destinations (Credits) */}
                  <div className="space-y-3">
                      {creditEntries.map((entry, idx) => (
                        <div key={entry.id} className="relative">
                            <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 border-card bg-green-500"></div>
                            <div className="p-3 rounded-xl border border-green-500/20 bg-green-500/5 flex justify-between items-center transition-colors hover:bg-green-500/10">
                                <div>
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">
                                        Destination {creditEntries.length > 1 ? `#${idx + 1}` : ''}
                                    </p>
                                    <p className="text-sm font-semibold text-foreground">{entry.wallet.name}</p>
                                </div>
                                <span className="font-mono text-sm font-medium text-green-500">
                                    +{formatCurrency(entry.amount)}
                                </span>
                            </div>
                        </div>
                      ))}
                      
                      {creditEntries.length === 0 && (
                          <div className="text-sm text-muted-foreground italic pl-2">
                              No allocation breakdown available.
                          </div>
                      )}
                  </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}