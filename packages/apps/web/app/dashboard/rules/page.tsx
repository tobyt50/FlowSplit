'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SplitRule, SplitType } from '@flowsplit/prisma';
import { getRules, deleteRule } from '../../../lib/ruleService';
import { getWallets, formatCurrency } from '../../../lib/walletService';
import { Button, buttonVariants } from '../../../components/ui/Button';
import { PlusCircle, SlidersHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../../components/ui/AlertDialog';
import { CreateRuleForm } from './_components/CreateRuleForm';
import { EditRuleForm } from './_components/EditRuleForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { EmptyState } from '../_components/EmptyState';
import { RuleActions } from './_components/RuleActions';
import { toast } from 'sonner';

export default function RulesPage() {
  const [rules, setRules] = useState<SplitRule[]>([]);
  const [wallets, setWallets] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State to manage which modal is open
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<SplitRule | null>(null);
  const [ruleToDelete, setRuleToDelete] = useState<SplitRule | null>(null);

  const fetchData = useCallback(async () => {
    try {
      if (rules.length === 0) setIsLoading(true);
      const [userRules, userWallets] = await Promise.all([getRules(), getWallets()]);
      setRules(userRules);
      setWallets(new Map(userWallets.map((w) => [w.id, w.name])));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [rules.length]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSuccess = () => {
    setIsCreateModalOpen(false);
    setRuleToEdit(null);
    fetchData();
  };

  const handleDelete = async () => {
    if (!ruleToDelete) return;
    try {
      await deleteRule(ruleToDelete.id);
      toast.success(`Rule "${ruleToDelete.name}" has been deleted.`);
      fetchData();
    } catch (err: any) {
      toast.error('Deletion Failed', { description: err.message });
    }
  };

  const formatValue = (rule: SplitRule) => {
    if (rule.type === SplitType.FIXED) {
      // Convert kobo value from DB to Naira string for display
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    return `${rule.value}%`;
  };

  const renderContent = () => {
    if (isLoading) return <p>Loading rules...</p>;
    if (error) return <p className="text-destructive">Error: {error}</p>;

    if (rules.length === 0) {
      return <EmptyState icon={SlidersHorizontal} title="No Split Rules Created" description="Create your first rule to automatically route your income into different wallets." actionText="Create Your First Rule" onActionClick={() => setIsCreateModalOpen(true)} />;
    }

    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Priority</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell>{rule.priority}</TableCell>
                <TableCell className="font-medium">{rule.name}</TableCell>
                <TableCell>{rule.type}</TableCell>
                <TableCell>{formatValue(rule)}</TableCell>
                <TableCell>{wallets.get(rule.destinationWalletId || '') || 'N/A'}</TableCell>
                <TableCell>
                  <RuleActions onEdit={() => setRuleToEdit(rule)} onDelete={() => setRuleToDelete(rule)} />
                </TableCell>
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
          <p className="text-muted-foreground mt-1">Define the rules for how your incoming funds are automatically split.</p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Create Rule</Button></DialogTrigger>
          <DialogContent><DialogHeader><DialogTitle>Create a New Split Rule</DialogTitle></DialogHeader><CreateRuleForm onSuccess={handleSuccess} /></DialogContent>
        </Dialog>
      </div>
      
      {renderContent()}

      {/* Edit Rule Modal */}
      <Dialog open={!!ruleToEdit} onOpenChange={(isOpen) => !isOpen && setRuleToEdit(null)}>
        <DialogContent><DialogHeader><DialogTitle>Edit Rule</DialogTitle></DialogHeader>{ruleToEdit && <EditRuleForm rule={ruleToEdit} onSuccess={handleSuccess} />}</DialogContent>
      </Dialog>
      
      {/* Delete Rule Confirmation Dialog */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={(isOpen) => !isOpen && setRuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone. This will permanently delete the "{ruleToDelete?.name}" rule.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive' })}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}