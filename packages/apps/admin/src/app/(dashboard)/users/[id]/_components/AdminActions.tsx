'use client';

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserStatus } from '@flowsplit/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../../components/ui/Card';
import { Button } from '../../../../../components/ui/Button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../../../components/ui/AlertDialog';
import { Input } from '../../../../../components/ui/Input';
import { toast } from 'sonner';
import { updateUserStatus } from '../../../../../lib/adminService';
import { UserDetail } from '@/packages/apps/admin/src/types/admin-api';

interface AdminActionsProps {
  user: UserDetail;
}

export function AdminActions({ user }: AdminActionsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const queryClient = useQueryClient();

  const { mutate: performStatusUpdate, isPending } = useMutation({
    mutationFn: updateUserStatus,
    
    onSuccess: (updatedUser) => {
      toast.success(`User status updated to ${updatedUser.status}`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'user', 'detail', user.id] });
      setShowDialog(false);
      setReason('');
    },
    
    onError: (error) => {
      toast.error('Action Failed', { description: error.message });
    },
  });

  const isSuspended = user.status === UserStatus.SUSPENDED;
  const actionText = isSuspended ? 'Unsuspend' : 'Suspend';
  const targetStatus = isSuspended ? UserStatus.ACTIVE : UserStatus.SUSPENDED;

  const handleSubmit = () => {
    if (!reason) {
      toast.error('A reason is required for this action.');
      return;
    }
    performStatusUpdate({ userId: user.id, status: targetStatus, reason });
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
        <CardContent>
          <Button 
            variant={isSuspended ? 'default' : 'destructive'} 
            className="w-full"
            onClick={() => setShowDialog(true)}
            disabled={user.role === 'SUPER_ADMIN'}
          >
            {actionText} User
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {isSuspended ? 'Unsuspending will restore their access.' : 'Suspending will block their ability to log in.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <label htmlFor="reason">Reason (for Audit)</label>
            <Input id="reason" placeholder="e.g., Violation of terms." value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isPending || !reason}>
              {isPending ? 'Processing...' : `Yes, ${actionText}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}