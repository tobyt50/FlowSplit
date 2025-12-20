'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { changePassword } from '../../../../lib/authService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { toast } from 'sonner';
import { Loader2, Lock, CheckCircle2, KeyRound } from 'lucide-react';

const formSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

export function ChangePasswordForm() {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password Updated', {
        description: 'Your password has been changed successfully.',
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
      reset(); 
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      
      {/* Current Password */}
      <div className="space-y-2">
        <label htmlFor="currentPassword" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" /> Current Password
        </label>
        <Input 
            id="currentPassword" 
            type="password" 
            {...register('currentPassword')} 
            disabled={isLoading} 
            placeholder="••••••••"
            className="bg-muted/50 border-input transition-all focus:bg-background"
        />
        {errors.currentPassword && <p className="text-destructive text-xs">{errors.currentPassword.message}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* New Password */}
        <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-foreground flex items-center gap-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" /> New Password
            </label>
            <Input 
                id="newPassword" 
                type="password" 
                {...register('newPassword')} 
                disabled={isLoading} 
                placeholder="Min 8 chars"
                className="bg-muted/50 border-input transition-all focus:bg-background"
            />
            {errors.newPassword && <p className="text-destructive text-xs">{errors.newPassword.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" /> Confirm New
            </label>
            <Input 
                id="confirmPassword" 
                type="password" 
                {...register('confirmPassword')} 
                disabled={isLoading} 
                placeholder="Re-enter password"
                className="bg-muted/50 border-input transition-all focus:bg-background"
            />
            {errors.confirmPassword && <p className="text-destructive text-xs">{errors.confirmPassword.message}</p>}
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : 'Update Password'}
        </Button>
      </div>
    </form>
  );
}