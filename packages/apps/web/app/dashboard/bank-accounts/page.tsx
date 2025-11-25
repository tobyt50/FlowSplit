'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { BankAccount, getBankAccounts } from '../../../lib/payoutService';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../dashboard/_components/EmptyState';
import { AddBankAccountModal } from './_components/AddBankAccountModal';
import { Plus, Building2, CheckCircle2 } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { toast } from 'sonner';
import { BankAccountActions } from './_components/BankAccountActions';
import { setPrimaryBankAccount, deleteBankAccount } from '../../../lib/payoutService';

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAccounts = useCallback(async () => {
    try {
      const data = await getBankAccounts();
      setAccounts(data);
    } catch (err: any) {
      toast.error('Error', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  if (isLoading) return <div className="p-8 text-center">Loading accounts...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Bank Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage external accounts for withdrawals.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Link Account
        </Button>
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Accounts Linked"
          description="Link your external bank account to enable withdrawals from your smart wallets."
          actionText="Link Bank Account"
          onActionClick={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.id} className={`relative overflow-hidden ${account.isPrimary ? 'border-primary/50 bg-primary/5' : ''}`}>
              
              <div className="absolute top-3 right-3 flex items-center gap-2">
                {account.isVerified && (
                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                    </Badge>
                )}
                <BankAccountActions 
                  account={account} 
                  onSetPrimary={handleSetPrimary} 
                  onDelete={handleDelete} 
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{account.bankName}</CardTitle>
                <CardDescription>Saved Recipient</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-mono tracking-wider mb-1">
                  {account.accountNumber}
                </div>
                <div className="text-sm text-muted-foreground uppercase font-medium truncate">
                  {account.accountName}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddBankAccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess}
      />
    </div>
  );
}