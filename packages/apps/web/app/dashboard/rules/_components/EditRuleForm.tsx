'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet, SplitRule, SplitType } from '@flowsplit/prisma';
import { getWallets } from '../../../../lib/walletService';
import { updateRule } from '../../../../lib/ruleService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DialogFooter } from '../../../../components/ui/Dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { Switch } from '../../../../components/ui/Switch';
import { Separator } from '../../../../components/ui/Separator';
import { ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// The schema is updated to include the bill-related fields and their validation logic.
const formSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  type: z.nativeEnum(SplitType),
  value: z.number().min(0.01, 'Value must be a positive number'),
  destinationWalletId: z.string().min(1, 'Please select a destination wallet'),
  priority: z.number().int().min(1),
  isBill: z.boolean(),
  dueDate: z.number().int().min(1).max(31).optional(),
}).refine(data => {
  if (data.type === SplitType.PERCENTAGE) return data.value <= 100;
  return true;
}, { message: 'Percentage value cannot exceed 100', path: ['value'] })
.refine(data => {
  if (data.isBill && (data.dueDate === undefined || data.dueDate === null)) return false;
  return true;
}, { message: 'Due date is required for bills.', path: ['dueDate'] });

type FormData = z.infer<typeof formSchema>;

interface EditRuleFormProps {
  rule: SplitRule; // The rule to be edited
  onSuccess: () => void;
}

export function EditRuleForm({ rule, onSuccess }: EditRuleFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    // Pre-populate the form with the data from the rule being edited
    defaultValues: {
      name: rule.name,
      type: rule.type,
      value: rule.type === SplitType.FIXED ? rule.value / 100 : rule.value,
      destinationWalletId: rule.destinationWalletId || '',
      priority: rule.priority,
      isBill: rule.isBill ?? false,
      dueDate: rule.dueDate || undefined,
    },
  });

  const ruleType = watch('type');
  const destinationWalletId = watch('destinationWalletId');
  const isBill = watch('isBill');
  const selectedWallet = wallets.find(w => w.id === destinationWalletId);

  useEffect(() => {
    getWallets().then(setWallets).catch(() => setError('Could not load wallets.'));
  }, []);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const valueToSubmit = data.type === SplitType.FIXED ? Math.round(data.value * 100) : data.value;

      await updateRule(rule.id, { ...data, value: valueToSubmit });
      toast.success(`Rule "${data.name}" updated successfully.`);
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Rule Name and Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Rule Name</label>
          <Input id="name" {...register('name')} disabled={isLoading} className="mt-1" />
          {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label htmlFor="priority" className="text-sm font-medium">Priority</label>
          <Input id="priority" type="number" {...register('priority', { valueAsNumber: true })} disabled={isLoading} className="mt-1" />
          {errors.priority && <p className="text-destructive text-xs mt-1">{errors.priority.message}</p>}
        </div>
      </div>

      {/* Type and Value */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="type" className="text-sm font-medium">Rule Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLoading}>
              <Button variant="outline" className="mt-1 w-full justify-start text-left font-normal">
                <span>{ruleType || 'Select type'}</span>
                <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
              {Object.values(SplitType).map((t) => (
                <DropdownMenuItem key={t} onSelect={() => setValue('type', t, { shouldValidate: true })} className="cursor-pointer">{t}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {errors.type && <p className="text-destructive text-xs mt-1">{errors.type.message}</p>}
        </div>
        <div>
          <label htmlFor="value" className="text-sm font-medium">{ruleType === 'FIXED' ? 'Fixed Amount (NGN)' : 'Percentage (%)'}</label>
          <Input id="value" type="number" step="0.01" {...register('value', { valueAsNumber: true })} disabled={isLoading} className="mt-1" />
          {errors.value && <p className="text-destructive text-xs mt-1">{errors.value.message}</p>}
        </div>
      </div>

      {/* Destination Wallet */}
      <div>
        <label htmlFor="destinationWalletId" className="text-sm font-medium">Destination Wallet</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading || wallets.length === 0}>
            <Button variant="outline" className="mt-1 w-full justify-start text-left font-normal">
              <span>{selectedWallet ? selectedWallet.name : 'Select a wallet...'}</span>
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
            {wallets.map((wallet) => (
              <DropdownMenuItem key={wallet.id} onSelect={() => setValue('destinationWalletId', wallet.id, { shouldValidate: true })} className="cursor-pointer">{wallet.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {errors.destinationWalletId && <p className="text-destructive text-xs mt-1">{errors.destinationWalletId.message}</p>}
      </div>

      <Separator />

      {/* Bill Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
          <div className="space-y-0.5"><label htmlFor="isBill" className="text-sm font-medium cursor-pointer">Recurring Bill</label><p className="text-xs text-muted-foreground">Track this as a recurring bill on your overview.</p></div>
          <Controller control={control} name="isBill" render={({ field }) => (<Switch id="isBill" checked={field.value} onCheckedChange={field.onChange} />)} />
        </div>
        {isBill && (
          <div>
            <label htmlFor="dueDate" className="text-sm font-medium">Due Day of Month</label>
            <Input id="dueDate" type="number" min="1" max="31" {...register('dueDate', { valueAsNumber: true })} className="mt-1" />
            {errors.dueDate && <p className="text-destructive text-xs mt-1">{errors.dueDate.message}</p>}
          </div>
        )}
      </div>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </form>
  );
}