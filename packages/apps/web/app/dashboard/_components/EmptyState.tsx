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

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 h-[400px]">
      <div className="flex flex-col items-center gap-3 text-center p-6 max-w-sm">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50 mb-2">
            <Icon className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
        <Button className="mt-4 rounded-xl shadow-lg" onClick={onActionClick}>
          <PlusCircle className="mr-2 h-4 w-4" />
          {actionText}
        </Button>
      </div>
    </div>
  );
}