'use client';

import React, { useState, useEffect } from 'react';
import { Wallet } from '../../../../types/index';
import { getWallets, deleteWallet, formatCurrency } from '../../../../lib/walletService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ChevronDown, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletToDelete: Wallet;
}

export function DeleteWalletModal({ isOpen, onClose, walletToDelete }: DeleteWalletModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [availableWallets, setAvailableWallets] = useState<Wallet[]>([]);

  const hasBalance = BigInt(walletToDelete.balance) > 0n;

  useEffect(() => {
    if (isOpen && hasBalance) {
      getWallets().then(wallets => {
        setAvailableWallets(wallets.filter(w => w.id !== walletToDelete.id));
      });
    }
  }, [isOpen, hasBalance, walletToDelete.id]);

  const handleDelete = async () => {
    if (hasBalance && !targetWalletId) {
      toast.error("Please select a wallet to transfer funds to.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteWallet(walletToDelete.id, targetWalletId);
      toast.success("Wallet deleted.");
      router.push('/dashboard/wallets'); 
    } catch (error: any) {
      toast.error("Deletion Failed", { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWalletName = availableWallets.find(w => w.id === targetWalletId)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Delete Wallet
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{walletToDelete.name}</strong>? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {hasBalance && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
            <p className="text-sm text-amber-500 font-medium">
              This wallet contains <strong>{formatCurrency(walletToDelete.balance)}</strong>.
            </p>
            <p className="text-sm text-muted-foreground">
              Select a destination to transfer these funds before deletion:
            </p>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-background border-input">
                  {selectedWalletName || "Select Wallet"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
                {availableWallets.map(w => (
                  <DropdownMenuItem key={w.id} onSelect={() => setTargetWalletId(w.id)} className="cursor-pointer">
                    {w.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
          Associated split rules will be disabled automatically.
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isLoading || (hasBalance && !targetWalletId)}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Delete Wallet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}