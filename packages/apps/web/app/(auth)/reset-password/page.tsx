'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/Card';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';
import api from '../../../lib/api';
import { API_URLS } from '../../../lib/config';

const schema = z.object({
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirm: z.string()
}).refine((data) => data.password === data.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
});

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const token = searchParams.get('token');
  const userId = searchParams.get('id');

  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    if (!token || !userId) {
        return toast.error('Invalid reset link.');
    }
    
    setIsLoading(true);
    try {
        await api.post(`${API_URLS.MONOLITH}/auth/reset-password`, {
            userId,
            token,
            newPassword: data.password
        });
        toast.success('Password Reset Successfully');
        router.push('/login');
    } catch (e: any) {
        toast.error('Reset Failed', { description: e.response?.data?.message || 'Link invalid or expired.' });
    } finally {
        setIsLoading(false);
    }
  };

  if (!token || !userId) {
      return (
        <Card className="w-full max-w-sm mx-auto border-destructive/50 bg-destructive/10">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center gap-2">
                <AlertCircle className="h-10 w-10 text-destructive" />
                <h3 className="text-lg font-semibold text-destructive">Invalid Link</h3>
                <p className="text-sm text-destructive/80">
                    This password reset link is invalid or has expired. Please request a new one.
                </p>
            </CardContent>
        </Card>
      );
  }

  return (
    <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-1 text-center pb-6">
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Reset Password</CardTitle>
            <CardDescription className="text-muted-foreground">
                Enter your new password details below to secure your account.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">New Password</label>
                    <Input 
                        type="password" 
                        {...register('password')} 
                        className="bg-muted/50"
                        placeholder="••••••••"
                    />
                    {errors.password && <p className="text-xs text-destructive">{String(errors.password.message)}</p>}
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <Input 
                        type="password" 
                        {...register('confirm')} 
                        className="bg-muted/50"
                        placeholder="••••••••"
                    />
                    {errors.confirm && <p className="text-xs text-destructive">{String(errors.confirm.message)}</p>}
                </div>
                <Button className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset Password'}
                </Button>
            </form>
        </CardContent>
    </Card>
  );
}