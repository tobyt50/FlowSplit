'use client';

import React, { useState } from 'react';
import { VirtualCard } from '../../../../types/index';
import { Button } from '../../../../components/ui/Button';
import { Snowflake, Flame, MoreVertical, Trash2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
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
import { toast } from 'sonner';
import api from '../../../../lib/api';
import { API_URLS } from '../../../../lib/config';

interface CardActionsProps {
  card: VirtualCard;
  onUpdate: () => void;
}

export function CardActions({ card, onUpdate }: CardActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  
  const isFrozen = card.status === 'FROZEN';
  const isCanceled = card.status === 'CANCELED';

  // Toggle Freeze/Unfreeze
  const toggleFreeze = async () => {
    setIsLoading(true);
    const newStatus = isFrozen ? 'ACTIVE' : 'FROZEN';
    try {
      await api.patch(`${API_URLS.MONOLITH}/cards/${card.id}/status`, { status: newStatus });
      toast.success(`Card ${isFrozen ? 'Unfrozen' : 'Frozen'}`);
      onUpdate();
    } catch (err: any) {
      toast.error('Action Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Permanently Cancel
  const handleCancel = async () => {
    setIsLoading(true);
    try {
      await api.delete(`${API_URLS.MONOLITH}/cards/${card.id}`);
      toast.success('Card Canceled Successfully');
      setShowCancelDialog(false);
      onUpdate();
    } catch (err: any) {
      toast.error('Cancellation Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCanceled) {
    return null; // Don't show actions for canceled cards
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <span className="sr-only">Open menu</span>
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 bg-card/95 border-border backdrop-blur-lg rounded-xl">
          <DropdownMenuItem 
            onClick={toggleFreeze} 
            disabled={isLoading}
            className="cursor-pointer rounded-lg my-0.5"
          >
            {isFrozen ? (
              <>
                <Flame className="mr-2 h-4 w-4 text-orange-500" /> 
                <span>Unfreeze Card</span>
              </>
            ) : (
              <>
                <Snowflake className="mr-2 h-4 w-4 text-blue-500" /> 
                <span>Freeze Card</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="bg-border/50" />
          
          <DropdownMenuItem 
            onClick={() => setShowCancelDialog(true)} 
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg my-0.5"
          >
            <Trash2 className="mr-2 h-4 w-4" /> 
            <span>Cancel Card</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirmation Modal for Cancellation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-card border-border rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Cancel this Virtual Card?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This action is <strong>irreversible</strong>. The card will be permanently deactivated and cannot be used for future transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading} className="rounded-xl">Abort</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel} 
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
            >
              {isLoading ? 'Canceling...' : 'Yes, Cancel Card'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}