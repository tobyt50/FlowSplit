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
  onSetPrimary: (_id: string) => void;
  onDelete: (_id: string) => void;
}

export function BankAccountActions({ account, onSetPrimary, onDelete }: BankAccountActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card border-border rounded-xl">
          <DropdownMenuItem 
            onClick={() => onSetPrimary(account.id)} 
            disabled={account.isPrimary}
            className={account.isPrimary ? 'opacity-50 cursor-default' : 'cursor-pointer'}
          >
            {account.isPrimary ? <Check className="mr-2 h-4 w-4 text-primary" /> : <Star className="mr-2 h-4 w-4" />}
            {account.isPrimary ? 'Primary Account' : 'Set as Primary'}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border/50" />
          <DropdownMenuItem 
            onClick={() => setShowDeleteDialog(true)} 
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Unlink Account</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Unlink Bank Account?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{account.bankName} ({account.accountNumber})</strong>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(account.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg"
            >
              Yes, Unlink
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}