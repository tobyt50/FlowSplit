'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { loginUser } from '../../../lib/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

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
      // On successful login, redirect to the user's dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Sign in to access your FlowSplit dashboard.
        </p>
      </div>

      {/* Show a success message if redirected from registration */}
      {registrationSuccess && (
        <div className="bg-accent/20 border border-accent/50 text-accent-foreground p-3 rounded-md text-center text-sm mb-4">
          Registration successful! Please sign in.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email Field */}
        <div>
          <Input type="email" placeholder="Email Address" {...register('email')} disabled={isLoading} />
          {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password Field */}
        <div>
          <Input type="password" placeholder="Password" {...register('password')} disabled={isLoading} />
          {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
        </div>

        {/* Display general API errors */}
        {error && <p className="text-destructive text-sm text-center">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="text-primary hover:underline">
          Sign Up
        </Link>
      </div>
    </>
  );
}