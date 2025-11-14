'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WalletType, Currency } from '@flowsplit/prisma';
import { createWallet } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DialogFooter } from '../../../../components/ui/Dialog';
import { toast } from 'sonner';

// Define the form validation schema with Zod
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  type: z.nativeEnum(WalletType),
  // We can add currency selection in the future if needed
});

type FormData = z.infer<typeof formSchema>;

interface CreateWalletFormProps {
  onSuccess: () => void; // A callback to run on successful creation
}

export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await createWallet(data);
      toast.success('Wallet Created', { // 2. Show a success toast
        description: `Your new wallet "${data.name}" has been successfully created.`,
      });
      onSuccess();
    } catch (err: any) {
      toast.error('Creation Failed', { // 3. Show an error toast
        description: err.message,
      });
      setError(err.message); // Keep local error state for inline messages if desired
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Wallet Name Field */}
      <div>
        <label htmlFor="name" className="text-sm font-medium">Wallet Name</label>
        <Input id="name" placeholder="e.g., Holiday Fund" {...register('name')} disabled={isLoading} className="mt-1" />
        {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
      </div>

      {/* Wallet Type Field */}
      <div>
        <label htmlFor="type" className="text-sm font-medium">Wallet Type</label>
        <select
          id="type"
          {...register('type')}
          disabled={isLoading}
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1"
        >
          {Object.values(WalletType).map((type) => (
            <option key={type} value={type}>{type.charAt(0) + type.slice(1).toLowerCase()}</option>
          ))}
        </select>
        {errors.type && <p className="text-destructive text-xs mt-1">{errors.type.message}</p>}
      </div>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <DialogFooter>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Wallet'}
        </Button>
      </DialogFooter>
    </form>
  );
}