'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginUser } from '../../../lib/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/Card';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const registrationSuccess = searchParams.get('registered') === 'true';

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
      await loginUser(data);
      router.push('/dashboard/overview');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 
        Mobile Logo: 
        Only visible on small screens (lg:hidden) to establish branding 
        since the left sidebar image is hidden.
      */}
      <div className="flex flex-col items-center gap-2 mb-2 lg:hidden">
        <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
           <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">FlowSplit</span>
      </div>

      <Card className="border-border bg-card shadow-xl">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access your dashboard.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Success Message Banner */}
          {registrationSuccess && (
            <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center text-sm text-green-500 font-medium">
              Registration successful! Please sign in.
            </div>
          )}

          {/* Error Message Banner */}
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                {...register('email')} 
                disabled={isLoading}
                className="bg-muted/50"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                {...register('password')} 
                disabled={isLoading}
                className="bg-muted/50"
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground pt-0">
          <div>
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors">
              Sign Up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}