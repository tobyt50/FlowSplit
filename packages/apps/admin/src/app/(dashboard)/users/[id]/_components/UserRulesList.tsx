'use client';

import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../../../../components/ui/Table';
import { Badge } from '../../../../../components/ui/Badge';
import { SplitType } from '@flowsplit/prisma';
import { formatCurrency } from '../../../../../lib/utils';
import { SplitRule } from '../../../../../types/admin-api'

interface UserRulesListProps {
  rules: SplitRule[];
  walletMap: Map<string, string>;
}

export function UserRulesList({ rules, walletMap }: UserRulesListProps) {
  if (rules.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">This user has not created any split rules.</p>;
  }

  const formatValue = (rule: SplitRule) => {
    if (rule.type === SplitType.FIXED) {
      return formatCurrency(BigInt(rule.value));
    }
    return `${rule.value}%`;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Priority</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Value</TableHead>
          <TableHead>Destination</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rules.map((rule) => (
          <TableRow key={rule.id}>
            <TableCell className="font-medium">{rule.priority}</TableCell>
            <TableCell>{rule.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{rule.type}</Badge>
            </TableCell>
            <TableCell className="font-mono">{formatValue(rule)}</TableCell>
            <TableCell>{walletMap.get(rule.destinationWalletId || '') || 'N/A'}</TableCell>
            <TableCell>
              <Badge variant={rule.isActive ? 'default' : 'outline'}>
                {rule.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}