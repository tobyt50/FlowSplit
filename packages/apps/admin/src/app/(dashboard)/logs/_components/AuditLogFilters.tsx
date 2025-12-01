'use client';

import React from 'react';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ChevronDown, Search } from 'lucide-react';
import { AdminActionType, AuditLogLevel } from '@flowsplit/prisma';
import { AuditLogFilters } from '../../../../types/admin-api';

interface AuditLogFiltersProps {
  filters: Partial<AuditLogFilters>;
  onFilterChange: (key: keyof AuditLogFilters, value: string | undefined) => void;
  onApply: () => void;
}

export function AuditLogFiltersComponent({ filters, onFilterChange, onApply }: AuditLogFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      <Input
        placeholder="Filter by Target User ID..."
        value={filters.targetUserId || ''}
        onChange={(e) => onFilterChange('targetUserId', e.target.value)}
        className="w-full sm:w-auto flex-grow"
      />
      
      {/* Level Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[180px] justify-between">
            {filters.level ? `Level: ${filters.level}` : 'Filter by Level'}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onFilterChange('level', undefined)}>All Levels</DropdownMenuItem>
          {Object.values(AuditLogLevel).map(level => (
            <DropdownMenuItem key={level} onSelect={() => onFilterChange('level', level)}>{level}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Action Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-[180px] justify-between">
            {filters.action ? `Action: ${filters.action}` : 'Filter by Action'}
            <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onFilterChange('action', undefined)}>All Actions</DropdownMenuItem>
          {Object.values(AdminActionType).map(action => (
            <DropdownMenuItem key={action} onSelect={() => onFilterChange('action', action)}>{action}</DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button onClick={onApply} className="w-full sm:w-auto">
        <Search className="mr-2 h-4 w-4" /> Apply
      </Button>
    </div>
  );
}
