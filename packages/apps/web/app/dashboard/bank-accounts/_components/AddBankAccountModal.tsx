'use client';

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addBankAccount } from '../../../../lib/payoutService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '../../../../components/ui/Dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '../../../../components/ui/DropdownMenu';
import { ChevronDown, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

const SUPPORTED_BANKS = [
  { name: 'Access Bank', code: '044' },
  { name: 'Guaranty Trust Bank', code: '058' },
  { name: 'United Bank for Africa', code: '033' },
  { name: 'Zenith Bank', code: '057' },
  { name: 'First Bank of Nigeria', code: '011' },
  { name: 'Kuda Bank', code: '50211' },
  { name: 'Opay', code: '999992' },
  { name: 'Moniepoint', code: '50515' },
];

const formSchema = z.object({
  accountNumber: z.string().length(10, 'Account number must be exactly 10 digits'),
  bankCode: z.string().min(1, 'Please select a bank'),
  accountType: z.enum(['SAVINGS', 'CURRENT']),
});

type FormData = z.infer<typeof formSchema>;

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddBankAccountModal({ isOpen, onClose, onSuccess }: AddBankAccountModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { accountType: 'SAVINGS' }
  });

  const selectedBankCode = watch('bankCode');
  const selectedBankName = SUPPORTED_BANKS.find(b => b.code === selectedBankCode)?.name;

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      await addBankAccount({
        ...data,
        bankName: selectedBankName || 'Unknown Bank',
      });
      toast.success('Account Verified & Linked');
      reset();
      onSuccess();
    } catch (err: any) {
      toast.error('Verification Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle>Link Bank Account</DialogTitle>
          <DialogDescription>
            Add an external account for withdrawals.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Bank Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Bank Name</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isLoading}>
                <Button variant="outline" className="w-full justify-between font-normal bg-muted border-input">
                  {selectedBankName || "Select Bank"}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[200px] overflow-y-auto bg-popover border-border">
                {SUPPORTED_BANKS.map((bank) => (
                  <DropdownMenuItem 
                    key={bank.code} 
                    onSelect={() => setValue('bankCode', bank.code, { shouldValidate: true })}
                    className="cursor-pointer"
                  >
                    {bank.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.bankCode && <p className="text-destructive text-xs">{errors.bankCode.message}</p>}
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Account Number</label>
            <Input 
              placeholder="0123456789" 
              {...register('accountNumber')} 
              maxLength={10}
              disabled={isLoading}
              className="bg-muted border-input font-mono tracking-wider"
            />
            {errors.accountNumber && <p className="text-destructive text-xs">{errors.accountNumber.message}</p>}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 border border-primary/10 p-3 rounded-lg">
            <Lock className="h-3 w-3 text-primary" />
            <span>Encrypted & verified securely via Paystack.</span>
          </div>

          <DialogFooter className="mt-2">
            <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isLoading ? 'Verifying...' : 'Verify & Link'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}