'use client';
import { useState, useEffect } from 'react';
import { useForm, SubmitHandler, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Wallet, SplitType } from '@flowsplit/prisma';
import { getWallets } from '../../../../lib/walletService'; // To fetch wallets for the dropdown
import { createRule } from '../../../../lib/ruleService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DialogFooter } from '../../../../components/ui/Dialog';
import { toast } from 'sonner';

// Define the form validation schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Name is required').max(50),
  type: z.literal(SplitType.PERCENTAGE), // Hardcoded for now
  value: z.coerce.number().min(0.01, 'Percentage must be positive').max(100),
  destinationWalletId: z.string().min(1, 'Please select a destination wallet'),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRuleFormProps {
  onSuccess: () => void;
}

export function CreateRuleForm({ onSuccess }: CreateRuleFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  // Fetch the user's wallets when the component mounts to populate the dropdown
  useEffect(() => {
    const fetchWallets = async () => {
      try {
        const userWallets = await getWallets();
        setWallets(userWallets);
      } catch (err) {
        setError('Could not load your wallets to select a destination.');
      }
    };
    fetchWallets();
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema) as Resolver<FormData>,
    defaultValues: {
      type: SplitType.PERCENTAGE,
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await createRule(data);
      toast.success('Rule created!', {
        description: `Your new rule has been successfully created.`,
      });
      onSuccess();
    } catch (err: any) {
      toast.error('Creation Failed', {
        description: err.message,
      });
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Rule Name */}
      <div>
        <label htmlFor="name" className="text-sm font-medium">Rule Name</label>
        <Input id="name" placeholder="e.g., Rent" {...register('name')} disabled={isLoading} className="mt-1" />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
      </div>
      {/* Percentage Value */}
      <div>
        <label htmlFor="value" className="text-sm font-medium">Percentage (%)</label>
        <Input id="value" type="number" step="0.01" placeholder="30" {...register('value')} disabled={isLoading} className="mt-1" />
        {errors.value && <p className="text-destructive text-xs mt-1">{errors.value.message}</p>}
      </div>
      {/* Destination Wallet */}
      <div>
        <label htmlFor="destinationWalletId" className="text-sm font-medium">Destination Wallet</label>
        <select
          id="destinationWalletId"
          {...register('destinationWalletId')}
          disabled={isLoading || wallets.length === 0}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
        >
          <option value="">Select a wallet...</option>
          {wallets.map((wallet) => (
            <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
          ))}
        </select>
        {errors.destinationWalletId && <p className="text-destructive text-xs mt-1">{errors.destinationWalletId.message}</p>}
      </div>
      
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Rule'}
        </Button>
      </DialogFooter>
    </form>
  );
}