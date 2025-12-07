'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet } from '../../../../types/index';
import { BankAccount, getBankAccounts, initiatePayout } from '../../../../lib/payoutService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '../../../../lib/walletService';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}

const formSchema = z.object({
  destinationBankId: z.string().min(1, 'Select a bank account'),
  amount: z.coerce.number().min(100, 'Minimum withdrawal is ₦1.00'),
});

type FormData = z.infer<typeof formSchema>;

export function WithdrawFundsModal({ isOpen, onClose, wallet, onSuccess }: WithdrawModalProps) {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destinationBankId: '',
      amount: undefined,
    }
  });

  const destinationId = watch('destinationBankId');
  const selectedBank = bankAccounts.find(b => b.id === destinationId);

  useEffect(() => {
    if (isOpen) {
      getBankAccounts().then(setBankAccounts).catch(() => toast.error('Could not load bank accounts'));
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    const amountBigInt = BigInt(Math.round(data.amount * 100)); // Kobo conversion
    
    if (amountBigInt > BigInt(wallet.balance)) {
      toast.error('Insufficient funds in wallet.');
      return;
    }

    setIsLoading(true);
    try {
      await initiatePayout({
        sourceWalletId: wallet.id,
        destinationBankId: data.destinationBankId,
        amount: Math.round(data.amount * 100),
        reference: `wd-${crypto.randomUUID()}`,
      });
      toast.success('Withdrawal Initiated', { description: 'Funds are on the way to your bank.' });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Withdrawal Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Withdraw Funds</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Transfer money from <strong className="text-foreground">{wallet.name}</strong> to your bank.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Destination Bank</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between bg-muted border-input rounded-xl h-11 font-normal hover:bg-muted/80">
                  {selectedBank ? `${selectedBank.bankName} - ${selectedBank.accountNumber}` : "Select Account"}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border rounded-xl">
                {bankAccounts.length === 0 && (
                    <DropdownMenuItem disabled className="text-muted-foreground">No linked accounts. Go to Settings to add one.</DropdownMenuItem>
                )}
                {bankAccounts.map(b => (
                  <DropdownMenuItem key={b.id} onSelect={() => setValue('destinationBankId', b.id, { shouldValidate: true })} className="cursor-pointer rounded-lg">
                    {b.bankName} • {b.accountNumber}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.destinationBankId && <p className="text-destructive text-xs">{errors.destinationBankId.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Amount (NGN)</label>
            <Input 
                type="number" 
                step="0.01" 
                {...register('amount')} 
                className="text-lg font-bold bg-muted border-input rounded-xl h-12" 
            />
            <p className="text-xs text-muted-foreground">Available: {formatCurrency(wallet.balance)}</p>
            {errors.amount && <p className="text-destructive text-xs">{errors.amount.message as string}</p>}
          </div>

          <DialogFooter className="mt-2">
            <Button type="submit" disabled={isLoading} className="w-full rounded-xl shadow-lg shadow-primary/20 h-11 text-base">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Withdrawal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}