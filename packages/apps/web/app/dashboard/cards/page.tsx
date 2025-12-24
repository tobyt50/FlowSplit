'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { getCards } from '../../../lib/cardService';
import { VirtualCard } from '../../../types/index';
import { CreditCard } from '../../../components/ui/CreditCard';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { IssueCardModal } from './_components/IssueCardModal';
import { CardActions } from './_components/CardActions';
import { EmptyState } from '../_components/EmptyState';
import { Plus, CreditCard as CardIcon, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { useHeaderStore } from '../../../lib/headerStore';

export default function CardsPage() {
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const { setHeader } = useHeaderStore();

  const fetchCards = useCallback(async () => {
  try {
    const data = await getCards();
    setCards(data);
    setHeader({ 
      title: 'Virtual Cards', 
      count: data.length, 
      label: 'Issued' 
    });
  } catch (err: any) {
    toast.error('Error', { description: err.message });
  } finally {
    setIsLoading(false);
  }
}, [setHeader]);


  useEffect(() => {
  fetchCards();
}, [fetchCards]);

  const activeCards = cards.filter(card => card.status !== 'CANCELED');

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
        Loading Cards...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-semibold text-foreground md:hidden">Virtual Cards</h2>
             <Badge variant="outline" className="md:hidden sm:flex bg-muted text-muted-foreground border-border">
                {activeCards.length} Issued
             </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Issue cards tied to your wallets for secure online spending.
          </p>
        </div>
        
        <Button onClick={() => setIsIssueOpen(true)} className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Issue Card
        </Button>
      </div>

      {activeCards.length === 0 ? (
        <EmptyState
          icon={CardIcon}
          title="No Active Cards"
          description="Create a virtual card linked to a specific wallet (e.g. 'Food') to spend directly from your split funds."
          actionText="Issue Virtual Card"
          onActionClick={() => setIsIssueOpen(true)}
        />
      ) : (
        <div className="grid gap-6 md:gap-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {activeCards.map((card) => (
            <div key={card.id} className="flex flex-col gap-4">
              
              {/* Card Container with Hover Lift */}
              <div className="relative group transition-transform duration-300 hover:-translate-y-1">
                
                {/* The Card Component */}
                <CreditCard card={card} />
                
                {/* Actions Overlay (Top Right) */}
                <div className="absolute top-2 right-2 z-20">
                  <CardActions card={card} onUpdate={fetchCards} />
                </div>

                {/* Frozen Overlay/Effect logic is handled inside CreditCard, 
                    but we add a helper text below if frozen for clarity */}
              </div>

              {/* Status Indicators */}
              {card.status === 'FROZEN' && (
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
                   <ShieldAlert className="h-4 w-4" />
                   Spending is currently disabled
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <IssueCardModal 
        isOpen={isIssueOpen} 
        onClose={() => setIsIssueOpen(false)} 
        onSuccess={fetchCards} 
      />
    </div>
  );
}