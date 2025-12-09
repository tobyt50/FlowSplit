'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet } from '../../../../types/index';
import { getWallets, formatCurrency } from '../../../../lib/walletService';
import api from '../../../../lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ArrowRight, ChevronDown, Loader2, Wallet as WalletIcon, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { API_URLS } from '../../../../lib/config';

interface InternalTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialFromWalletId?: string;
  initialAmount?: string;
}

const formSchema = z.object({
  fromWalletId: z.string().min(1, 'Source wallet is required'),
  toWalletId: z.string().min(1, 'Destination wallet is required'),
  amount: z.coerce.number().min(100, 'Minimum transfer is ₦1.00'),
});

type FormData = z.infer<typeof formSchema>;

export function InternalTransferModal({ isOpen, onClose, onSuccess, initialFromWalletId, initialAmount }: InternalTransferModalProps) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: initialAmount ? Number(initialAmount) / 100 : undefined,
      fromWalletId: initialFromWalletId || '',
      toWalletId: '',
    }
  });

  const fromId = watch('fromWalletId');
  const toId = watch('toWalletId');

  useEffect(() => {
    if (isOpen) {
      getWallets().then(setWallets);
      if (initialFromWalletId) setValue('fromWalletId', initialFromWalletId);
      if (initialAmount) setValue('amount', Number(initialAmount) / 100);
    }
  }, [isOpen, initialFromWalletId, initialAmount, setValue]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      await api.post(`${API_URLS.MONOLITH}/wallets/transfer`, {
        fromWalletId: data.fromWalletId,
        toWalletId: data.toWalletId,
        amount: Math.round(data.amount * 100),
      });
      toast.success('Funds Transferred Successfully');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error('Transfer Failed', { description: err.response?.data?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const getWalletName = (id: string) => wallets.find(w => w.id === id)?.name || 'Select Wallet';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-primary" />
            Move Funds
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Transfer money instantly between your smart wallets.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-2">
          
          {/* Visual Transfer Card: Stacked on Mobile, Row on Desktop */}
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
            
            {/* FROM WALLET */}
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">From</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between truncate bg-background border-border/50 h-11 rounded-xl px-3 font-normal hover:bg-muted/50">
                    <span className="truncate">{getWalletName(fromId)}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] bg-popover border-border max-h-[200px] overflow-y-auto rounded-xl">
                  {wallets.map(w => (
                    <DropdownMenuItem 
                      key={w.id} 
                      onSelect={() => setValue('fromWalletId', w.id, { shouldValidate: true })} 
                      disabled={w.id === toId}
                      className="cursor-pointer py-2"
                    >
                      <div className="flex flex-col items-start w-full">
                        <span className="font-medium">{w.name}</span>
                        <span className="text-[10px] text-muted-foreground">{formatCurrency(w.balance, w.currency)}</span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.fromWalletId && <p className="text-destructive text-[10px] pl-1">{errors.fromWalletId.message}</p>}
            </div>

            {/* Arrow Indicator: Down on Mobile, Right on Desktop */}
            <div className="flex items-center justify-center py-1 md:py-0 md:pt-5 text-muted-foreground/50">
               <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                  <ArrowDown className="h-4 w-4 md:hidden" />
                  <ArrowRight className="h-4 w-4 hidden md:block" />
               </div>
            </div>

            {/* TO WALLET */}
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground pl-1">To</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between truncate bg-background border-border/50 h-11 rounded-xl px-3 font-normal hover:bg-muted/50">
                    <span className="truncate">{getWalletName(toId)}</span> 
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px] bg-popover border-border max-h-[200px] overflow-y-auto rounded-xl">
                  {wallets.map(w => (
                    <DropdownMenuItem 
                      key={w.id} 
                      onSelect={() => setValue('toWalletId', w.id, { shouldValidate: true })} 
                      disabled={w.id === fromId}
                      className="cursor-pointer py-2"
                    >
                      <span className="font-medium">{w.name}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {errors.toWalletId && <p className="text-destructive text-[10px] pl-1">{errors.toWalletId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground pl-1">Amount (NGN)</label>
            <div className="relative">
                <Input 
                    type="number" 
                    step="0.01" 
                    {...register('amount')} 
                    className="h-12 text-lg font-bold bg-muted border-input rounded-xl pl-4"
                    placeholder="0.00"
                />
            </div>
            {errors.amount && <p className="text-destructive text-xs pl-1">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isLoading} className="w-full h-11 rounded-xl text-base shadow-lg shadow-primary/20">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Transfer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}