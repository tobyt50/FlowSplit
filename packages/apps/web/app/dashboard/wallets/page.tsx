'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Wallet } from '@flowsplit/prisma';
import { getWallets } from '../../../lib/walletService';
import { Button } from '../../../components/ui/Button';
import { PlusCircle, Wallet as WalletIcon } from 'lucide-react'; // Renamed to avoid conflict
import { WalletCard } from './_components/WalletCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/Dialog';
import { CreateWalletForm } from './_components/CreateWalletForm';
import { EmptyState } from '../_components/EmptyState'; // 1. Import the new EmptyState component

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchWallets = useCallback(async () => {
    try {
      // Set loading to true only if there are no wallets yet, to avoid layout shift on refresh
      if (wallets.length === 0) setIsLoading(true);
      const userWallets = await getWallets();
      setWallets(userWallets);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [wallets.length]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCreationSuccess = () => {
    setIsModalOpen(false);
    fetchWallets();
  };

  const renderContent = () => {
    if (isLoading) return <p>Loading wallets...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;

    // 2. Conditionally render the EmptyState or the grid
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {wallets.map((wallet) => (
          <WalletCard key={wallet.id} wallet={wallet} />
        ))}
      </div>
    );
  };
  
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">My Wallets</h1>
          <p className="text-muted-foreground mt-1">
            An overview of your smart-wallets and their balances.
          </p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Wallet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Wallet</DialogTitle>
              <DialogDescription>
                Give your new smart-wallet a name and a type to help you categorize your funds.
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