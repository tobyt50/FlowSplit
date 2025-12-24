'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/Card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import api from '../../../lib/api';
import { API_URLS } from '../../../lib/config';

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
        await api.post(`${API_URLS.MONOLITH}/auth/forgot-password`, data);
        setIsSent(true);
    } catch (e) {
        toast.error('Request failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md border-border bg-card shadow-xl animate-in fade-in zoom-in-95 duration-300">
        {!isSent ? (
            <>
                <CardHeader className="space-y-1 text-center pb-6">
                    <CardTitle className="text-2xl font-bold tracking-tight text-foreground">Forgot Password?</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Enter your email address and we&apos;ll send you a link to reset your password.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <Input 
                                placeholder="name@example.com" 
                                type="email" 
                                {...register('email')} 
                                disabled={isLoading}
                                className="bg-muted/50"
                            />
                            {errors.email && <p className="text-xs text-destructive">{String(errors.email.message)}</p>}
                        </div>
                        <Button className="w-full" disabled={isLoading}>
                            {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : 'Send Reset Link'}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pt-0">
                    <Link 
                        href="/login" 
                        className="text-sm text-muted-foreground hover:text-primary flex items-center gap-2 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                </CardFooter>
            </>
        ) : (
            <div className="p-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/5">
                    <Mail className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">Check your email</h2>
                <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed">
                    We have sent a password reset link to your email address.
                </p>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/login">Back to Login</Link>
                </Button>
                <button 
                    onClick={() => setIsSent(false)} 
                    className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    Didn&apos;t receive it? Try again
                </button>
            </div>
        )}
    </Card>
  );
}