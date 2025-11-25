'use client';

import React, { useState } from 'react';
import { MoreVertical, Trash2, Star, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../../components/ui/DropdownMenu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../../components/ui/AlertDialog';
import { BankAccount } from '../../../../lib/payoutService';

interface BankAccountActionsProps {
  account: BankAccount;
  onSetPrimary: (id: string) => void;
  onDelete: (id: string) => void;
}

export function BankAccountActions({ account, onSetPrimary, onDelete }: BankAccountActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem 
            onClick={() => onSetPrimary(account.id)} 
            disabled={account.isPrimary}
            className={account.isPrimary ? 'opacity-50 cursor-default' : ''}
          >
            {account.isPrimary ? <Check className="mr-2 h-4 w-4" /> : <Star className="mr-2 h-4 w-4" />}
            {account.isPrimary ? 'Primary Account' : 'Set as Primary'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)} 
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Unlink Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{account.bankName} ({account.accountNumber})</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(account.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Yes, Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}