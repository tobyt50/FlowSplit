'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { registerUser } from '../../../lib/authService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/Card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number (e.g. +234...)'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

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
      toast.success('Account created successfully!');
      router.push('/dashboard/overview');
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
    <>
      {/* Mobile Logo: Visible only on small screens */}
      <div className="flex flex-col items-center gap-2 -mt-12 mb-2 lg:hidden">
        <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
           <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" />
        </div>
        <span className="text-lg tracking-wide font-bold transition-colors">
            <span className="text-foreground">Flow</span>
            <span className="text-teal">Split</span>
        </span>
      </div>

      <Card className="border-border bg-card shadow-xl max-w-lg w-full mx-auto">
        <CardHeader className="space-y-1 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Split income, save effortlessly, and master your finances.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
            
            {/* First Name (Half Width) */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label htmlFor="firstName" className="text-sm font-medium text-foreground">First Name</label>
              <Input 
                id="firstName" 
                placeholder="John" 
                {...register('firstName')} 
                disabled={isLoading}
                className="bg-muted/50" 
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>

            {/* Last Name (Half Width) */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label htmlFor="lastName" className="text-sm font-medium text-foreground">Last Name</label>
              <Input 
                id="lastName" 
                placeholder="Doe" 
                {...register('lastName')} 
                disabled={isLoading}
                className="bg-muted/50" 
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>

            {/* Email (Full Width) */}
            <div className="space-y-2 col-span-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">Email Address</label>
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

            {/* Phone Number (Half Width) */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="+234..." 
                {...register('phone')} 
                disabled={isLoading}
                className="bg-muted/50" 
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            {/* Password (Half Width) */}
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <Input 
                id="password" 
                type="password" 
                placeholder="********" 
                {...register('password')} 
                disabled={isLoading}
                className="bg-muted/50" 
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="col-span-2 mt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Account...
                    </>
                ) : (
                    'Create Account'
                )}
                </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground pt-0">
          <div>
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors">
              Sign In
            </Link>
          </div>
        </CardFooter>
      </Card>
    </>
  );
}