'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { globalSearch, SearchResults } from '../../../lib/searchService';
import { useHeaderStore } from '../../../lib/headerStore';

// UI Components
import { WalletCard } from '../wallets/_components/WalletCard';
import { RecentTransactions } from '../overview/_components/RecentTransactions';
import { CreditCard } from '../../../components/ui/CreditCard'; 
import { Card } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Loader2, SearchX, Wallet, SlidersHorizontal, History, CreditCard as CardIcon } from 'lucide-react';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const { setHeader } = useHeaderStore();
  
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 1. Update Header on Mount/Update
  useEffect(() => {
    setHeader({ 
      title: 'Search Results', 
      count: null, 
      label: '' 
    });
  }, [setHeader]);

  // 2. Perform Search
  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="p-4 rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground animate-pulse">Searching for <span className="text-foreground font-medium">&quot;{query}&quot;</span>...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
        <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
            <SearchX className="h-12 w-12 text-muted-foreground/50" />
        </div>
        <div className="max-w-xs">
            <h3 className="text-lg font-semibold text-foreground">Search FlowSplit</h3>
            <p className="text-sm text-muted-foreground mt-1">Enter a keyword to search your wallets, cards, rules, or transaction history.</p>
        </div>
      </div>
    );
  }

  const hasResults = results && (
    results.wallets.length > 0 || 
    results.rules.length > 0 || 
    results.transactions.length > 0 ||
    results.cards.length > 0
  );

  if (results && !hasResults) {
    return (
      <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center px-4">
         <div className="p-6 bg-muted/30 rounded-3xl border border-border/50">
            <SearchX className="h-12 w-12 text-muted-foreground/50" />
         </div>
         <div className="max-w-sm">
            <h3 className="text-lg font-semibold text-foreground">No results found</h3>
            <p className="text-sm text-muted-foreground mt-1">We couldn&apos;t find anything matching <span className="text-foreground font-medium">&quot;{query}&quot;</span>.</p>
            <p className="text-xs text-muted-foreground mt-4 bg-muted/50 py-2 px-4 rounded-full inline-block">
                Try searching for a wallet name, transaction ID, or amount.
            </p>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10 px-1">
      
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold text-foreground md:hidden">Search Results</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Found results for</span>
            <Badge variant="secondary" className="text-xs px-2 h-5 font-normal bg-primary/10 text-primary border-primary/20">
                &quot;{query}&quot;
            </Badge>
        </div>
      </div>

      {/* 1. WALLETS SECTION */}
      {results?.wallets && results.wallets.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                <Wallet className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Wallets <span className="text-muted-foreground ml-1 font-normal">({results.wallets.length})</span></h3>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.wallets.map(w => <WalletCard key={w.id} wallet={w} />)}
          </div>
        </section>
      )}

      {/* 2. VIRTUAL CARDS SECTION */}
      {results?.cards && results.cards.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                <CardIcon className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Virtual Cards <span className="text-muted-foreground ml-1 font-normal">({results.cards.length})</span></h3>
          </div>
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
             {results.cards.map(card => (
               <div key={card.id} className="relative group transition-transform hover:-translate-y-1">
                  <CreditCard card={card} />
               </div>
             ))}
          </div>
        </section>
      )}

      {/* 3. SPLIT RULES SECTION */}
      {results?.rules && results.rules.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-500">
                <SlidersHorizontal className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Split Rules <span className="text-muted-foreground ml-1 font-normal">({results.rules.length})</span></h3>
          </div>
          <Card className="overflow-hidden border-border bg-card">
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead>Rule Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="text-right">Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {results.rules.map(r => (
                            <TableRow key={r.id} className="border-border/40 hover:bg-muted/30">
                                <TableCell className="font-medium text-foreground">{r.name}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="bg-muted/50 border-border text-[10px] uppercase font-bold text-muted-foreground">
                                        {r.type}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-mono text-sm">
                                    {r.type === 'PERCENTAGE' ? `${r.value}%` : `₦${r.value}`}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground">{r.priority}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
          </Card>
        </section>
      )}

      {/* 4. TRANSACTIONS SECTION */}
      {results?.transactions && results.transactions.length > 0 && (
         <section className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-green-500/10 text-green-500">
                    <History className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Transactions <span className="text-muted-foreground ml-1 font-normal">({results.transactions.length})</span></h3>
            </div>
            <RecentTransactions transactions={results.transactions} />
         </section>
      )}
    </div>
  );
}