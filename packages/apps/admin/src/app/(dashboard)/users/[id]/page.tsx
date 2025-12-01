'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Wallet, FileText, Landmark, SlidersHorizontal } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../components/ui/Card';
import { Badge } from '../../../../components/ui/Badge';
import { toast } from 'sonner';
import { getAdminUserById } from '../../../../lib/adminService';
import { UserDetail } from '../../../../types/admin-api';
import { AdminActions } from './_components/AdminActions';
import { UserWalletsList } from '../_components/UserWalletsList';
import { UserTransactionsList } from '../_components/UserTransactionsList';
import { UserBankAccountsList } from './_components/UserBankAccountsList';
import { UserRulesList } from './_components/UserRulesList';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const { data: user, isLoading, isError, error } = useQuery<UserDetail, Error>({
    queryKey: ['admin', 'user', 'detail', params.id],
    queryFn: () => getAdminUserById(params.id),
  });

  if (isError) {
    toast.error('Failed to load user', { description: error.message });
    router.push('/users');
    return null;
  }

  const walletMap = useMemo(() => {
    if (!user) return new Map<string, string>();
    return new Map(user.wallets.map(w => [w.id, w.name]));
  }, [user]);

  if (isLoading || !user) {
    return <div className="text-center p-8">Loading user profile...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        {/* 2. Corrected Link href */}
        <Link href="/users">
          <Button variant="outline" size="icon" className="h-7 w-7">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to Users</span>
          </Button>
        </Link>
        <h1 className="flex-1 text-xl font-semibold tracking-tight">{user.fullName}</h1>
        <Badge variant={user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? 'destructive' : 'outline'} className="ml-auto sm:ml-0">
          {user.role}
        </Badge>
      </div>

      {/* 3. Suspended User Banner */}
      {user.status === 'SUSPENDED' && (
        <div className="text-center p-2 rounded-lg bg-destructive/10 text-destructive font-semibold border border-destructive/20">
          This account is currently SUSPENDED.
        </div>
      )}

      {/* Main Grid Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Left Column: Core Details & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader><CardTitle>User Information</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="font-medium">{user.email}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{user.phone || 'Not Provided'}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">User Since</span><span className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</span></div>
            </CardContent>
          </Card>
          
          {/* 4. Use the real AdminActions component */}
          <AdminActions user={user} />
        </div>

        {/* Right Column: User's Financial Data */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Wallets ({user.wallets.length})</CardTitle></CardHeader>
            <CardContent>
              <UserWalletsList wallets={user.wallets} />
            </CardContent>
          </Card>
          
          {/* Bank Accounts Card */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5 text-primary" /> Bank Accounts ({user.bankAccounts.length})</CardTitle></CardHeader>
            <CardContent>
              <UserBankAccountsList bankAccounts={user.bankAccounts} />
            </CardContent>
          </Card>

          {/*Split Rules Card */}
           <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-primary" /> Split Rules ({user.splitRules.length})</CardTitle></CardHeader>
            <CardContent>
              <UserRulesList rules={user.splitRules} walletMap={walletMap} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Recent Transactions</CardTitle>
              <CardDescription>Last 10 transactions initiated by this user.</CardDescription>
            </CardHeader>
            <CardContent>
              <UserTransactionsList transactions={user.transactions} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}