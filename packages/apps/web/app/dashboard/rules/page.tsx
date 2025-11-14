'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SplitRule } from '@flowsplit/prisma';
import { getRules } from '../../../lib/ruleService';
import { getWallets } from '../../../lib/walletService';
import { Button } from '../../../components/ui/Button';
import { PlusCircle, SlidersHorizontal } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/Dialog';
import { CreateRuleForm } from './_components/CreateRuleForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/Table';
import { EmptyState } from '../_components/EmptyState'; // 1. Import EmptyState

export default function RulesPage() {
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [wallets, setWallets] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    // Set loading only on initial fetch
    if (rules.length === 0) setIsLoading(true);
    try {
      const [userRules, userWallets] = await Promise.all([
        getRules(),
        getWallets(),
      ]);
      setRules(userRules);
      setWallets(new Map(userWallets.map((w) => [w.id, w.name])));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [rules.length]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreationSuccess = () => {
    setIsModalOpen(false);
    fetchData();
  };

  const renderContent = () => {
    if (isLoading) return <p>Loading rules...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;

    // 2. Conditionally render the EmptyState or the Table
    if (rules.length === 0) {
      return (
        <EmptyState
          icon={SlidersHorizontal}
          title="No Split Rules Created"
          description="Split rules automatically route a percentage of your income to different wallets. Create your first rule to get started."
          actionText="Create Your First Rule"
          onActionClick={() => setIsModalOpen(true)}
        />
      );
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Priority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.type}</TableCell>
                <TableCell>{rule.value}%</TableCell>
                <TableCell>
                  {wallets.get(rule.destinationWalletId || '') || 'N/A'}
                </TableCell>
                <TableCell>{rule.priority}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Split Rules</h1>
          <p className="text-muted-foreground mt-1">
            Define the rules for how your incoming funds are automatically
            split.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create a New Split Rule</DialogTitle>
              <DialogDescription>
                Set a percentage of your income to automatically route to a
                specific wallet.
              </DialogDescription>
            </DialogHeader>
            <CreateRuleForm onSuccess={handleCreationSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      {renderContent()}
    </div>
  );
}
