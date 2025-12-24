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
} from '../../../components/ui/Dialog';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Copy, CheckCircle2, Loader2, Phone, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../lib/api';
import { updateUserProfile } from '../../../lib/userService';
import { API_URLS } from '../../../lib/config';

interface VirtualAccount {
  bankName: string;
  accountNumber: string;
  accountName: string;
}

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const phoneSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

export function AddFundsModal({ isOpen, onClose }: AddFundsModalProps) {
  const [account, setAccount] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMissingPhone, setIsMissingPhone] = useState(false);
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  useEffect(() => {
    if (isOpen && !account && !isMissingPhone) {
      fetchAccount();
    }
  }, [isOpen, account, isMissingPhone]);

  const fetchAccount = async () => {
    setIsLoading(true);
    setError(null);
    setIsMissingPhone(false);
    try {
      const res = await api.get<VirtualAccount>(`${API_URLS.MONOLITH}/transactions/virtual-account`);
      setAccount(res.data);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Could not retrieve account details.';
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
      await updateUserProfile({ phone: data.phone });
      toast.success('Phone number updated.');
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

  const handleOpenChange = (open: boolean) => {
    if (!open) setIsMissingPhone(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        {isMissingPhone ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-500">
                <Phone className="h-5 w-5" /> Action Required
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Regulatory compliance requires a valid phone number to generate your dedicated account.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onPhoneSubmit)} className="space-y-4 py-2">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
                <Input 
                  id="phone" 
                  placeholder="+234..." 
                  {...register('phone')} 
                  className="bg-muted border-input"
                />
                {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit" disabled={isUpdatingPhone}>
                  {isUpdatingPhone ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save & Continue'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Add Funds</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Transfer to your dedicated account to instantly fund your wallet.
              </DialogDescription>
            </DialogHeader>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Generating account details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-6 text-destructive bg-destructive/10 rounded-xl border border-destructive/20">
                <p>{error}</p>
                <Button variant="link" onClick={fetchAccount} className="mt-2 text-destructive">Try Again</Button>
              </div>
            ) : account ? (
              <div className="space-y-6 py-2">
                {/* Bank Card UI */}
                <div className="relative overflow-hidden rounded-xl border border-border bg-muted/30 p-4 sm:p-6 shadow-inner">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>
                  
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Virtual Account</span>
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>

                  <div className="space-y-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
                        <p className="text-lg font-semibold text-foreground">{account.bankName}</p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Number</p>
                        <div className="flex items-center gap-3">
                            {/* Responsive font size */}
                            <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-foreground">
                                {account.accountNumber}
                            </span>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(account.accountNumber, 'Account Number')}
                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Account Name</p>
                        <p className="font-medium text-foreground tracking-wide">{account.accountName}</p>
                    </div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm text-primary/80">
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                  <p>Transfers are automatically detected and split according to your active rules.</p>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}