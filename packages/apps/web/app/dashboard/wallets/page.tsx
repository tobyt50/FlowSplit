'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wallet } from '../../../types/index';
import { getWallets } from '../../../lib/walletService';
import { PlusCircle, Wallet as WalletIcon } from 'lucide-react';
import { WalletCard } from './_components/WalletCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import { CreateWalletForm } from './_components/CreateWalletForm';
import { EmptyState } from '../_components/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { useHeaderStore } from '../../../lib/headerStore';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setHeader } = useHeaderStore();

  const fetchWallets = useCallback(async () => {
  try {
    setIsLoading(true);
    const userWallets = await getWallets();
    setWallets(userWallets);
    setHeader({ 
      title: 'My Wallets', 
      count: userWallets.length, 
      label: 'Active' 
    });
  } catch (err: any) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
}, [setHeader]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreationSuccess = () => {
    setIsModalOpen(false);
    fetchWallets();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
          Loading Wallets...
        </div>
      );
    }

    if (error) {
       return (
        <div className="text-destructive text-center pt-10 bg-destructive/10 p-6 rounded-xl border border-destructive/20">
          Error: {error}
        </div>
      );
    }

    if (wallets.length === 0) {
      return (
        <EmptyState
          icon={WalletIcon}
          title="No Wallets Found"
          description="Get started by creating your first smart-wallet. This will be the destination for your split funds."
          actionText="Create Your First Wallet"
          onActionClick={() => setIsModalOpen(true)}
        />
      );
    }

    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wallets.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet} />
        ))}
        
        {/* "Add New" Ghost Card for quick access */}
        <button 
           onClick={() => setIsModalOpen(true)}
           className="flex flex-col items-center justify-center h-[180px] rounded-2xl border border-dashed border-border hover:bg-muted/30 hover:border-primary/50 transition-all group"
        >
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                <PlusCircle className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-primary">Create New Wallet</span>
        </button>
      </div>
    );
  };
  
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3 md:hidden">
             <h2 className="text-lg font-semibold text-foreground">My Wallets</h2>
             <Badge variant="outline" className="md:hidden sm:flex bg-muted text-muted-foreground border-border">
                {wallets.length} Active
             </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Overview of your smart-wallets and balances.
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create a New Wallet</DialogTitle>
              <DialogDescription>
                Give your new smart-wallet a name and category.
              </DialogDescription>
            </DialogHeader>
            <CreateWalletForm onSuccess={handleCreationSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      {renderContent()}
    </div>
  );
}