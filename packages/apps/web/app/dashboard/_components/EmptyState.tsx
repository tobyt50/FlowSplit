import React from 'react';
import { Button } from '../../../components/ui/Button';
import { PlusCircle } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  actionText: string;
  onActionClick: () => void;
}

/**
 * A reusable component for displaying a user-friendly "empty state".
 * It guides the user on what to do next when a list or page is empty.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-[400px]">
      <div className="flex flex-col items-center gap-2 text-center">
        <Icon className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight">{title}</h3>
        <p className="text-sm text-muted-foreground max-w-sm">{description}</p>
        <Button className="mt-4" onClick={onActionClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {actionText}
        </Button>
      </div>
    </div>
  );
}