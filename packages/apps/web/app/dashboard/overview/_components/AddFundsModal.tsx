'use client';

import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '../../../../components/ui/Dialog';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Copy, CheckCircle2, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import { updateUserProfile } from '../../../../lib/userService';

interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Schema for the inline phone form
const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number (e.g. +234...)'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export function AddFundsModal({ isOpen, onClose }: AddFundsModalProps) {
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State to handle the "Missing Phone" recovery flow
  const [isMissingPhone, setIsMissingPhone] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  // Form setup for phone recovery
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  useEffect(() => {
    // Only fetch if open, no account data yet, and we aren't currently fixing the phone issue
    if (isOpen && !account && !isMissingPhone) {
      fetchAccount();
    }
  }, [isOpen]);

  const fetchAccount = async () => {
    setIsLoading(true);
    setError(null);
    setIsMissingPhone(false);

    try {
      const res = await api.get<VirtualAccount>('http://localhost:3103/api/transactions/virtual-account');
      setAccount(res.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Could not retrieve account details.';

      // Check if the error is specifically about the missing phone number (400 Bad Request)
      if (err.response?.status === 400 && errorMessage.toLowerCase().includes('phone')) {
        setIsMissingPhone(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onPhoneSubmit: SubmitHandler<PhoneFormData> = async (data) => {
    setIsUpdatingPhone(true);
    try {
      // 1. Update the user profile via user-service
      await updateUserProfile({ phone: data.phone });
      toast.success('Phone number updated.');

      // 2. Automatically retry fetching the account now that the profile is fixed
      setIsMissingPhone(false);
      await fetchAccount();

    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsUpdatingPhone(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  // Reset internal state when modal is fully closed
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setIsMissingPhone(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        
        {/* --- SCENARIO 1: MISSING PHONE RECOVERY FLOW --- */}
        {isMissingPhone ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <Phone className="h-5 w-5" /> Action Required
              </DialogTitle>
              <DialogDescription>
                To generate your dedicated bank account, we require a valid phone number for regulatory compliance.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number
                </label>
                <Input 
                  id="phone" 
                  placeholder="+234..." 
                  {...register('phone')} 
                />
                {errors.phone && (
                  <p className="text-destructive text-xs">{errors.phone.message}</p>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isUpdatingPhone}>
                  {isUpdatingPhone ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          /* --- SCENARIO 2: STANDARD ACCOUNT DISPLAY FLOW --- */
          <>
            <DialogHeader>
              <DialogTitle>Add Funds</DialogTitle>
              <DialogDescription>
                Make a bank transfer to this dedicated account to instantly fund your FlowSplit wallet.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <p className="text-sm text-muted-foreground">Generating your unique account...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-destructive bg-destructive/10 rounded-md">
                <p>{error}</p>
                <Button variant="link" onClick={fetchAccount} className="mt-2">
                  Try Again
                </Button>
              </div>
            ) : account ? (
              <div className="space-y-6 py-4">
                <div className="p-4 bg-muted/50 rounded-lg border space-y-4">
                  
                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Bank Name
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">{account.bankName}</div>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Account Number
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="font-mono text-3xl font-bold tracking-widest text-primary">
                        {account.accountNumber}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => copyToClipboard(account.accountNumber, 'Account Number')}
                        className="h-8 w-8"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Account Name
                    </label>
                    <div className="font-medium">{account.accountName}</div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-sm">
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    Transfers to this account are automatically detected and split according to your active rules immediately.
                  </p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}