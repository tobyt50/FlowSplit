'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BankAccount, getBankAccounts } from '../../../lib/payoutService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../dashboard/_components/EmptyState';
import { AddBankAccountModal } from './_components/AddBankAccountModal';
import { Plus, Building2, CheckCircle2, Star } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { toast } from 'sonner';
import { BankAccountActions } from './_components/BankAccountActions';
import { setPrimaryBankAccount, deleteBankAccount } from '../../../lib/payoutService';
import { cn } from '../../../lib/utils';
import { useHeaderStore } from '../../../lib/headerStore';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setHeader } = useHeaderStore();

  const fetchAccounts = useCallback(async () => {
  try {
    const data = await getBankAccounts();
    setAccounts(data);
    setHeader({ 
      title: 'Bank Accounts', 
      count: data.length, 
      label: 'Linked' 
    });
  } catch (err: any) {
    toast.error('Error', { description: err.message });
  } finally {
    setIsLoading(false);
  }
}, [setHeader]);

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryBankAccount(id);
      toast.success('Primary account updated');
      fetchAccounts();
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBankAccount(id);
      toast.success('Account unlinked successfully');
      fetchAccounts();
    } catch (err: any) {
      toast.error('Deletion Failed', { description: err.message });
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    fetchAccounts();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
          Loading accounts...
        </div>
      );
    }

    if (accounts.length === 0) {
      return (
        <EmptyState
          icon={Building2}
          title="No Accounts Linked"
          description="Link your external bank account to enable withdrawals from your smart wallets."
          actionText="Link Bank Account"
          onActionClick={() => setIsModalOpen(true)}
        />
      );
    }

    return (
      <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account) => (
          <Card 
            key={account.id} 
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border bg-card group h-[180px] flex flex-col justify-between",
              account.isPrimary ? 'border-primary/50 ring-1 ring-primary/20' : 'hover:border-primary/30'
            )}
          >
            {/* Background Gradient */}
            <div className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none",
                account.isPrimary ? "from-primary/20 to-transparent" : "from-muted/20 to-transparent"
            )} />

            {/* Top Bar: Verification Badge & Actions */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
              {account.isPrimary && (
                  <Badge variant="default" className="gap-1 h-6 px-2 bg-primary/20 text-primary hover:bg-primary/20 border-primary/20">
                      <Star className="h-3 w-3 fill-current" /> Primary
                  </Badge>
              )}
              {account.isVerified && !account.isPrimary && (
                  <Badge variant="secondary" className="gap-1 h-6 px-2 bg-green-500/10 text-green-500 hover:bg-green-500/10 border-green-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                  </Badge>
              )}
              <BankAccountActions 
                account={account} 
                onSetPrimary={handleSetPrimary} 
                onDelete={handleDelete} 
              />
            </div>

            <CardHeader className="pt-6 px-6 pb-0 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center mb-3 text-muted-foreground border border-border/50 shadow-sm">
                 <Building2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-semibold text-foreground truncate pr-8">
                  {account.bankName}
              </CardTitle>
            </CardHeader>

            <CardContent className="pb-6 px-6 relative z-10">
              <div className="space-y-1">
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider text-[10px]">Account Number</p>
                  <p className="text-2xl font-mono font-bold tracking-widest text-foreground">
                    {account.accountNumber}
                  </p>
              </div>
              <div className="mt-3 pt-3 border-t border-border/40 flex justify-between items-center">
                  <p className="text-xs text-muted-foreground font-medium truncate max-w-[200px]">
                    {account.accountName}
                  </p>
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-semibold text-foreground md:hidden">Bank Accounts</h2>
             <Badge variant="outline" className="md:hidden sm:flex bg-muted text-muted-foreground border-border">
                {accounts.length} Linked
             </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Manage external accounts for payouts.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
          <Plus className="mr-2 h-4 w-4" /> Link Account
        </Button>
      </div>

      {renderContent()}

      <AddBankAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess}
      />
    </div>
  );
}