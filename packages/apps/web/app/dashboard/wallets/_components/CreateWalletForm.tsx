'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { WalletTypes } from '../../../../lib/enums';
import { createWallet } from '../../../../lib/walletService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { DialogFooter } from '../../../../components/ui/Dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../../../../components/ui/DropdownMenu';
import { toast } from 'sonner';
import { Loader2, ChevronDown } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  type: z.nativeEnum(WalletTypes),
});

type FormData = z.infer<typeof formSchema>;

interface CreateWalletFormProps {
  onSuccess: () => void;
}

export function CreateWalletForm({ onSuccess }: CreateWalletFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: WalletTypes.SAVINGS, // Default value
    },
  });

  // Watch the type to display it in the button
  const selectedType = watch('type');

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      await createWallet(data);
      toast.success('Wallet Created', {
        description: `"${data.name}" is ready.`,
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

  // Helper to format enum values (e.g., "SAVINGS" -> "Savings")
  const formatType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium text-foreground">Wallet Name</label>
        <Input 
          id="name" 
          placeholder="e.g., Holiday Fund" 
          {...register('name')} 
          disabled={isLoading}
          className="bg-muted border-input"
        />
        {errors.name && <p className="text-destructive text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="type" className="text-sm font-medium text-foreground">Wallet Type</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild disabled={isLoading}>
            <Button 
              variant="outline" 
              className="w-full justify-between bg-muted border-input font-normal text-foreground"
            >
              <span className="flex items-center gap-2">
                {selectedType ? formatType(selectedType) : 'Select type'}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border">
            {Object.values(WalletTypes).map((type) => (
              <DropdownMenuItem 
                key={type} 
                onSelect={() => setValue('type', type, { shouldValidate: true })}
                className="cursor-pointer"
              >
                {formatType(type)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {errors.type && <p className="text-destructive text-xs">{errors.type.message}</p>}
      </div>

      {error && <div className="text-destructive text-sm text-center bg-destructive/10 p-2 rounded-md">{error}</div>}

      <DialogFooter className="mt-4 gap-2 sm:gap-0">
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {isLoading ? 'Creating...' : 'Create Wallet'}
        </Button>
      </DialogFooter>
    </form>
  );
}