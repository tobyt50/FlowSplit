'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Wallet } from '../../../../types/index';
import { issueCard } from '../../../../lib/cardService';
import { getWallets, formatCurrency } from '../../../../lib/walletService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ChevronDown, Loader2, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface IssueCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const formSchema = z.object({
  walletId: z.string().min(1, 'Please select a funding wallet'),
  nameOnCard: z.string().min(2, 'Name is required').max(24, 'Name too long for card'),
});

type FormData = z.infer<typeof formSchema>;

export function IssueCardModal({ isOpen, onClose, onSuccess }: IssueCardModalProps) {
  const router = useRouter();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const selectedWalletId = watch('walletId');
  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  useEffect(() => {
    if (isOpen) {
      getWallets().then(setWallets).catch(() => toast.error('Could not load wallets'));
      setKycError(null);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setKycError(null);
    try {
      await issueCard(data);
      toast.success('Virtual Card Issued Successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      // Handle the specific KYC error from StripeIssuingService
      if (err.message.includes('Billing address')) {
        setKycError('You must complete your billing profile (Address & Phone) before issuing a card.');
      } else {
        toast.error('Issuance Failed', { description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" /> Issue Virtual Card
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Create a card tied to a specific wallet. Spending is limited to the wallet's balance.
          </DialogDescription>
        </DialogHeader>

        {kycError ? (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-sm flex flex-col gap-3 mt-2">
                <div className="flex items-center gap-2 text-destructive font-bold uppercase tracking-wide text-xs">
                    <AlertTriangle className="h-4 w-4" /> Profile Incomplete
                </div>
                <p className="text-muted-foreground leading-relaxed">{kycError}</p>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="self-start rounded-lg border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { onClose(); router.push('/dashboard/settings'); }}
                >
                    Go to Settings <ArrowRight className="ml-2 h-3 w-3" />
                </Button>
            </div>
        ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-3">
            
            {/* Name Input */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Name on Card</label>
                <Input 
                    placeholder="JOHN DOE" 
                    {...register('nameOnCard')} 
                    disabled={isLoading}
                    className="uppercase font-mono bg-muted border-input rounded-xl h-11 tracking-wider placeholder:normal-case placeholder:font-sans" 
                />
                {errors.nameOnCard && <p className="text-destructive text-xs">{errors.nameOnCard.message}</p>}
            </div>

            {/* Wallet Select */}
            <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Funding Wallet</label>
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-12 bg-muted border-input rounded-xl hover:bg-muted/80" disabled={isLoading}>
                    {selectedWallet ? (
                        <div className="flex items-center justify-between w-full pr-2">
                            <span className="font-medium truncate">{selectedWallet.name}</span>
                            <span className="text-muted-foreground text-xs font-mono bg-background/50 px-2 py-0.5 rounded ml-2">
                                {formatCurrency(selectedWallet.balance)}
                            </span>
                        </div>
                    ) : (
                        <span className="text-muted-foreground">Select Wallet</span>
                    )}
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border rounded-xl max-h-[200px] overflow-y-auto">
                    {wallets.map(w => (
                    <DropdownMenuItem 
                        key={w.id} 
                        onSelect={() => setValue('walletId', w.id)}
                        className="flex flex-col items-start py-2 px-3 cursor-pointer my-1 rounded-lg"
                    >
                        <span className="font-medium text-foreground">{w.name}</span>
                        <span className="text-xs text-muted-foreground">{formatCurrency(w.balance, w.currency)}</span>
                    </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
                </DropdownMenu>
                {errors.walletId && <p className="text-destructive text-xs">{errors.walletId.message}</p>}
            </div>

            <DialogFooter className="pt-2">
                <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl text-base shadow-lg shadow-primary/20">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Issue Card'}
                </Button>
            </DialogFooter>
            </form>
        )}
      </DialogContent>
    </Dialog>
  );
}