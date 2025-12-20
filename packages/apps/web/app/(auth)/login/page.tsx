'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { verify2FALogin } from '../../../lib/authService';
import { useAuthStore } from '../../../lib/authStore';
import api from '../../../lib/api';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../../components/ui/Card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { API_URLS } from '../../../lib/config';

// --- SCHEMAS ---

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const otpSchema = z.object({
  code: z.string().min(6, 'Enter 6 characters').max(20), // Support TOTP (6) or Recovery Codes
});

type LoginFormData = z.infer<typeof loginSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registrationSuccess = searchParams.get('registered') === 'true';

  // --- STATE ---
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // 2FA State
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  // --- FORMS ---
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const otpForm = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  // --- HANDLERS ---

  const onLoginSubmit: SubmitHandler<LoginFormData> = async (data) => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Raw API call to handle the 2FA fork
      const res = await api.post(`${API_URLS.MONOLITH}/auth/login`,
            data);
      
      if (res.data.requiresTwoFactor) {
        // --- PATH A: 2FA REQUIRED ---
        setTempToken(res.data.tempToken);
        setRequires2FA(true);
        toast.info('Two-Factor Authentication Required');
      } else {
        // --- PATH B: STANDARD LOGIN ---
        const { accessToken } = res.data;
        
        useAuthStore.getState().setToken(accessToken);
        
        // Fetch profile to complete session setup
        const profile = await api.get(`${API_URLS.MONOLITH}/auth/profile`, { 
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        useAuthStore.getState().setUser(profile.data);

        router.push('/dashboard/overview');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const onOtpSubmit: SubmitHandler<OtpFormData> = async (data) => {
    if (!tempToken) return;
    setIsLoading(true);
    setError(null);
    try {
      // 2. Verify 2FA Code
      await verify2FALogin(tempToken, data.code);
      toast.success('Welcome back!');
      router.push('/dashboard/overview');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Mobile Logo (Preserved) */}
      <div className="flex flex-col items-center gap-2 -mt-24 mb-2 lg:hidden">
        <div className="relative h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-primary/20">
           <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" />
        </div>
        <span className="text-lg tracking-wide font-bold transition-colors">
            <span className="text-foreground">Flow</span>
            <span className="text-teal">Split</span>
        </span>
      </div>

      <Card className="border-border bg-card shadow-xl transition-all duration-300">
        
        {/* Dynamic Header */}
        <CardHeader className="space-y-1 text-center pb-6">
          {requires2FA ? (
            <div className="flex flex-col items-center">
                <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                    <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight">Security Check</CardTitle>
                <CardDescription>
                    Enter your 2FA code or recovery key.
                </CardDescription>
            </div>
          ) : (
            <>
                <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                <CardDescription>
                    Enter your credentials to access your dashboard.
                </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Messages */}
          {!requires2FA && registrationSuccess && (
            <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-3 text-center text-sm text-green-500 font-medium">
              Registration successful! Please sign in.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-center text-sm text-destructive font-medium">
              {error}
            </div>
          )}

          {/* --- VIEW 1: STANDARD LOGIN FORM --- */}
          {!requires2FA && (
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  {...loginForm.register('email')} 
                  disabled={isLoading}
                  className="bg-muted/50"
                />
                {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••" 
                  {...loginForm.register('password')} 
                  disabled={isLoading}
                  className="bg-muted/50"
                />
                {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</> : 'Sign In'}
              </Button>
            </form>
          )}

          {/* --- VIEW 2: OTP / 2FA FORM --- */}
          {requires2FA && (
             <form onSubmit={otpForm.handleSubmit(onOtpSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Input 
                        id="code" 
                        placeholder="123456" 
                        {...otpForm.register('code')} 
                        disabled={isLoading}
                        className="bg-muted/50 text-center text-lg tracking-[0.25em] font-mono"
                        autoFocus
                    />
                    {otpForm.formState.errors.code && <p className="text-xs text-destructive text-center">{otpForm.formState.errors.code.message}</p>}
                </div>

                <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</> : 'Verify Code'}
                </Button>
             </form>
          )}
        </CardContent>
        
        {/* Dynamic Footer */}
        <CardFooter className="flex flex-col gap-4 text-center text-sm text-muted-foreground pt-0">
          {!requires2FA ? (
            <div>
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors">
                Sign Up
              </Link>
            </div>
          ) : (
            <button 
                onClick={() => window.location.reload()} 
                className="text-primary hover:text-primary/80 font-medium underline-offset-4 hover:underline transition-colors"
            >
                Back to Login
            </button>
          )}
        </CardFooter>
      </Card>
    </>
  );
}