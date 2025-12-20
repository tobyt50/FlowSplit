'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet, SplitRule } from '../../../../types/index';
import { SplitTypes } from '../../../../lib/enums';
import { getWallets } from '../../../../lib/walletService';
import { updateRule } from '../../../../lib/ruleService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DialogFooter } from '../../../../components/ui/Dialog';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { Switch } from '../../../../components/ui/Switch';
import { Separator } from '../../../../components/ui/Separator';
import { ChevronDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  type: z.nativeEnum(SplitTypes),
  value: z.number().min(0.01, 'Value must be a positive number'),
  destinationWalletId: z.string().min(1, 'Please select a destination wallet'),
  priority: z.number().int().min(1),
  isBill: z.boolean(),
  dueDate: z.number().int().min(1).max(31).optional(),
}).refine(data => {
  if (data.type === SplitTypes.PERCENTAGE) return data.value <= 100;
  return true;
}, { message: 'Percentage value cannot exceed 100', path: ['value'] })
.refine(data => {
  if (data.isBill && (data.dueDate === undefined || data.dueDate === null)) return false;
  return true;
}, { message: 'Due date is required for bills.', path: ['dueDate'] });

type FormData = z.infer<typeof formSchema>;

interface EditRuleFormProps {
  rule: SplitRule;
  onSuccess: () => void;
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Essential (First)' },
  { value: 5, label: 'High' },
  { value: 10, label: 'Standard' },
  { value: 20, label: 'Low (Last)' },
];

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
    defaultValues: {
      name: rule.name,
      type: rule.type,
      value: rule.type === SplitTypes.FIXED ? rule.value / 100 : rule.value,
      destinationWalletId: rule.destinationWalletId || '',
      priority: rule.priority,
      isBill: rule.isBill ?? false,
      dueDate: rule.dueDate || undefined,
    },
  });

  const ruleType = watch('type');
  const destinationWalletId = watch('destinationWalletId');
  const isBill = watch('isBill');
  const priority = watch('priority');
  const selectedWallet = wallets.find(w => w.id === destinationWalletId);

  useEffect(() => {
    getWallets().then(setWallets).catch(() => setError('Could not load wallets.'));
  }, []);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      const valueToSubmit = data.type === SplitTypes.FIXED ? Math.round(data.value * 100) : data.value;

      await updateRule(rule.id, { ...data, value: valueToSubmit });
      toast.success('Rule Updated', { description: `"${data.name}" saved.` });
      onSuccess();
    } catch (err: any) {
      setError(err.message);
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium text-foreground">Rule Name</label>
          <Input id="name" {...register('name')} disabled={isLoading} className="bg-muted border-input" />
          {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
            <label htmlFor="priority" className="text-sm font-medium text-foreground">Priority</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild disabled={isLoading}>
                <Button variant="outline" className="w-full justify-between bg-muted border-input font-normal">
                  {PRIORITY_OPTIONS.find(p => p.value === priority)?.label || priority}
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[180px]">
                {PRIORITY_OPTIONS.map((opt) => (
                  <DropdownMenuItem key={opt.value} onSelect={() => setValue('priority', opt.value, { shouldValidate: true })} className="cursor-pointer">
                    <span className={opt.value === 1 ? 'font-semibold text-amber-600' : ''}>{opt.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <input type="hidden" {...register('priority', { valueAsNumber: true })} />
            {errors.priority && <p className="text-destructive text-xs">{errors.priority.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="type" className="text-sm font-medium text-foreground">Type</label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLoading}>
              <Button variant="outline" className="w-full justify-between bg-muted border-input font-normal">
                {ruleType || 'Select type'}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[180px]">
              {Object.values(SplitTypes).map((t) => (
                <DropdownMenuItem key={t} onSelect={() => setValue('type', t, { shouldValidate: true })} className="cursor-pointer">{t}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
        </div>
        <div className="space-y-2">
          <label htmlFor="value" className="text-sm font-medium text-foreground">
             {ruleType === 'FIXED' ? 'Amount (NGN)' : 'Percent (%)'}
          </label>
          <Input id="value" type="number" step="0.01" {...register('value', { valueAsNumber: true })} disabled={isLoading} className="bg-muted border-input" />
          {errors.value && <p className="text-destructive text-xs">{errors.value.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="destinationWalletId" className="text-sm font-medium text-foreground">Destination Wallet</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading || wallets.length === 0}>
            <Button variant="outline" className="w-full justify-between bg-muted border-input font-normal">
              <span className="truncate">{selectedWallet ? selectedWallet.name : 'Select a wallet...'}</span>
              <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)]">
            {wallets.map((wallet) => (
              <DropdownMenuItem key={wallet.id} onSelect={() => setValue('destinationWalletId', wallet.id, { shouldValidate: true })} className="cursor-pointer">{wallet.name}</DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {errors.destinationWalletId && <p className="text-destructive text-xs">{errors.destinationWalletId.message}</p>}
      </div>

      <Separator className="bg-border/50" />

      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/20">
          <div className="space-y-0.5"><label htmlFor="isBill" className="text-sm font-medium cursor-pointer text-foreground">Recurring Bill</label><p className="text-xs text-muted-foreground">Track as a monthly obligation.</p></div>
          <Controller control={control} name="isBill" render={({ field }) => (<Switch id="isBill" checked={field.value} onCheckedChange={field.onChange} />)} />
        </div>
        {isBill && (
          <div className="space-y-2 animate-in slide-in-from-top-2">
            <label htmlFor="dueDate" className="text-sm font-medium text-foreground">Due Day</label>
            <Input id="dueDate" type="number" min="1" max="31" {...register('dueDate', { valueAsNumber: true })} className="bg-muted border-input" />
            {errors.dueDate && <p className="text-destructive text-xs">{errors.dueDate.message}</p>}
          </div>
        )}
      </div>

      {error && <div className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md">{error}</div>}

      <DialogFooter className="mt-4">
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Save Changes
        </Button>
      </DialogFooter>
    </form>
  );
}