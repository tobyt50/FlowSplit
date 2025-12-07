'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet } from '../../../../types/index';
import { updateWallet } from '../../../../lib/walletService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface EditWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet: Wallet;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  targetAmount: z.coerce.number().min(0, 'Target cannot be negative'),
});

type FormData = z.infer<typeof formSchema>;

export function EditWalletModal({ isOpen, onClose, wallet, onSuccess }: EditWalletModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const initialTargetNaira = Number(wallet.targetAmount) / 100;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: wallet.name,
      targetAmount: initialTargetNaira,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      // Convert Naira back to Kobo for the API
      const targetAmountKobo = Math.round(data.targetAmount * 100);

      await updateWallet(wallet.id, {
        name: data.name,
        targetAmount: targetAmountKobo,
      });

      toast.success('Wallet Updated');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const targetLabel = wallet.type === 'SAVINGS' ? 'Savings Goal (NGN)' : 'Monthly Budget Limit (NGN)';
  const targetDesc = wallet.type === 'SAVINGS' 
    ? 'Set a goal to track your savings progress.' 
    : 'Set a limit to monitor your spending velocity.';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Edit Wallet</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Update details for your <strong className="text-foreground">{wallet.name}</strong> wallet.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-2">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-foreground">Wallet Name</label>
            <Input 
              id="name" 
              {...register('name')} 
              disabled={isLoading}
              className="bg-muted border-input rounded-xl"
            />
            {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
          </div>

          {/* Target Amount Field */}
          <div className="space-y-2">
            <label htmlFor="targetAmount" className="text-sm font-medium text-foreground">{targetLabel}</label>
            <Input 
              id="targetAmount" 
              type="number" 
              step="0.01" 
              {...register('targetAmount')} 
              disabled={isLoading}
              className="bg-muted border-input rounded-xl"
            />
            <p className="text-xs text-muted-foreground">{targetDesc}</p>
            {errors.targetAmount && <p className="text-destructive text-xs">{errors.targetAmount.message}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="rounded-xl shadow-lg shadow-primary/20">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}