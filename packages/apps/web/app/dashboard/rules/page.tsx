'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SplitRule } from '../../../types/index';
import { SplitTypes } from '../../../lib/enums';
import { getRules, deleteRule } from '../../../lib/ruleService';
import { getWallets, formatCurrency } from '../../../lib/walletService';
import { Button, buttonVariants } from '../../../components/ui/Button';
import { PlusCircle, SlidersHorizontal, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/Dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../../components/ui/AlertDialog';
import { CreateRuleForm } from './_components/CreateRuleForm';
import { EditRuleForm } from './_components/EditRuleForm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { EmptyState } from '../_components/EmptyState';
import { RuleActions } from './_components/RuleActions';
import { Badge } from '../../../components/ui/Badge';
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
      toast.success(`Rule "${ruleToDelete.name}" deleted.`);
      fetchData();
    } catch (err: any) {
      toast.error('Deletion Failed', { description: err.message });
    }
  };

  const formatValue = (rule: SplitRule) => {
    if (rule.type === SplitTypes.FIXED) {
      return formatCurrency(BigInt(Math.round(rule.value)));
    }
    return `${rule.value}%`;
  };

  const renderContent = () => {
    if (isLoading) return (
      <div className="flex h-[50vh] items-center justify-center text-primary animate-pulse">
        Loading Rules...
      </div>
    );
    
    if (error) return (
      <div className="text-destructive text-center pt-10 bg-destructive/10 p-6 rounded-xl border border-destructive/20">
        Error: {error}
      </div>
    );

    if (rules.length === 0) {
      return <EmptyState icon={SlidersHorizontal} title="No Split Rules Created" description="Create your first rule to automatically route your income into different wallets." actionText="Create Your First Rule" onActionClick={() => setIsCreateModalOpen(true)} />;
    }

    return (
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/50">
              <TableHead className="w-[80px]">Priority</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id} className="border-border/40 hover:bg-muted/30">
                <TableCell className="text-muted-foreground font-mono">#{rule.priority}</TableCell>
                <TableCell className="font-medium text-foreground">{rule.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px] uppercase font-bold tracking-wider">
                    {rule.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">{formatValue(rule)}</TableCell>
                <TableCell className="text-muted-foreground flex items-center gap-1">
                   <ArrowRight className="h-3 w-3 opacity-50" /> 
                   {wallets.get(rule.destinationWalletId || '') || 'N/A'}
                </TableCell>
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
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <div className="flex items-center gap-3">
             <h2 className="text-lg font-semibold text-foreground">Split Rules</h2>
             <Badge variant="outline" className="hidden sm:flex bg-muted text-muted-foreground border-border">
                {rules.length} Active
             </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            Define how your incoming funds are automatically distributed.
          </p>
        </div>
        
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
                <PlusCircle className="mr-2 h-4 w-4" /> Create Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
              <DialogTitle>Create a New Split Rule</DialogTitle>
              <DialogDescription>
                Configure the logic for your automatic fund allocation.
              </DialogDescription>
            </DialogHeader>
            <CreateRuleForm onSuccess={handleSuccess} />
          </DialogContent>
        </Dialog>
      </div>
      
      {renderContent()}

      {/* Edit Rule Modal */}
      <Dialog open={!!ruleToEdit} onOpenChange={(isOpen) => !isOpen && setRuleToEdit(null)}>
        <DialogContent className="sm:max-w-md bg-card border-border">
            <DialogHeader>
                <DialogTitle>Edit Rule</DialogTitle>
            </DialogHeader>
            {ruleToEdit && <EditRuleForm rule={ruleToEdit} onSuccess={handleSuccess} />}
        </DialogContent>
      </Dialog>
      
      {/* Delete Rule Confirmation Dialog */}
      <AlertDialog open={!!ruleToDelete} onOpenChange={(isOpen) => !isOpen && setRuleToDelete(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the &quot;{ruleToDelete?.name}&quot; rule.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: 'destructive', className: 'rounded-lg' })}>
                Delete Rule
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}