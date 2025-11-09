'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerUser } from '../../../lib/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

// Define the validation schema using Zod for type-safe form validation
const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// Infer the TypeScript type from the schema
type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
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
      await registerUser(data);
      // On successful registration, redirect to the login page with a success message
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Create an Account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter your details to start splitting your finances.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Full Name Field */}
        <div>
          <Input placeholder="Full Name" {...register('fullName')} disabled={isLoading} />
          {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
        </div>

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
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <div className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </>
  );
}