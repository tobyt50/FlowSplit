'use client';

import React from 'react';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '../../../../components/ui/DropdownMenu';

interface RuleActionsProps {
  onEdit: () => void;
  onDelete: () => void;
}

export function RuleActions({ onEdit, onDelete }: RuleActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 bg-card border-border rounded-xl">
        <DropdownMenuItem onClick={onEdit} className="cursor-pointer rounded-lg my-0.5">
          <Pencil className="mr-2 h-3.5 w-3.5" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg my-0.5">
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}