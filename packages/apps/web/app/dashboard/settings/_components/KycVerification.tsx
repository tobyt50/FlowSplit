'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { ShieldCheck, AlertTriangle, Clock, Lock, Loader2, Calendar, ArrowRight, X, Shield, FileText } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../../../lib/api';
import { useAuthStore } from '../../../../lib/authStore';
import { API_URLS } from '../../../../lib/config';
import { Tier2UploadForm } from './Tier2UploadForm';

const formSchema = z.object({
  bvn: z.string().length(11, 'BVN must be 11 digits'),
  dob: z.string().min(1, 'Date of Birth is required (YYYY-MM-DD)'),
});

export function KycVerification() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dob: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await api.post(`${API_URLS.MONOLITH}/kyc/submit`, data);
      toast.success('KYC Submitted', { description: 'We are processing your details.' });
      window.location.reload(); 
    } catch (err: any) {
      toast.error('Submission Failed', { description: err.response?.data?.message });
    } finally {
      setIsLoading(false);
    }
  };

  // --- COMPONENT: STATUS INFO CARD ---
  const StatusInfoCard = ({ 
    icon: Icon, 
    title, 
    description, 
    statusColor, 
    buttonText, 
    onAction 
  }: any) => (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" /> Identity Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className={`flex flex-col sm:flex-row items-start gap-4 p-4 rounded-xl border ${statusColor}`}>
            <div className={`p-2.5 rounded-full shrink-0 ${statusColor.replace('bg-', 'bg-opacity-20 ').replace('border-', 'bg-')}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1">
                <p className="font-semibold text-sm text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
            </div>
        </div>
        
        {buttonText && (
            <div className="mt-4 flex justify-end">
                <Button onClick={onAction} className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/20">
                    {buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        )}
      </CardContent>
    </Card>
  );

  // --- RENDER LOGIC ---

  // 1. Tier 2 Verified (Complete)
  if (user?.kycStatus === 'VERIFIED' && user?.kycTier === 'TIER_2') {
      return (
        <StatusInfoCard 
            icon={ShieldCheck}
            title="Account Verified (Tier 2)"
            description="You have successfully completed all verification steps. Your account limits are lifted."
            statusColor="bg-green-500/5 border-green-500/20 text-green-500"
        />
      );
  }

  // 2. Pending Review (Any Tier)
  if (user?.kycStatus === 'PENDING') {
     return (
        <StatusInfoCard 
            icon={Clock}
            title="Verification in Progress"
            description="We are currently verifying your documents with government records. This usually takes a few minutes to 24 hours."
            statusColor="bg-blue-500/5 border-blue-500/20 text-blue-500"
        />
     );
  }

  // 3. Tier 1 Verified / Ready for Tier 2
  if (user?.kycStatus === 'VERIFIED' && user?.kycTier === 'TIER_1') {
      if (showForm) {
          // The form now handles its own header and close button via onClose
          return <Tier2UploadForm onClose={() => setShowForm(false)} />;
      }
      return (
        <StatusInfoCard 
            icon={FileText}
            title="Tier 1 Verified"
            description="Your basic identity is verified. Upgrade to Tier 2 by uploading a government ID to unlock higher transaction limits."
            statusColor="bg-primary/5 border-primary/20 text-primary"
            buttonText="Upgrade to Tier 2"
            onAction={() => setShowForm(true)}
        />
      );
  }

  // 4. Failed State (Tier 1 or 2)
  if (user?.kycStatus === 'FAILED') {
      if (showForm) {
          // If Tier 2 failed, show Tier 2 form again. If Tier 1 failed, show BVN form.
          return user?.kycTier === 'TIER_1' ? (
             <Tier2UploadForm onClose={() => setShowForm(false)} />
          ) : (
             <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-foreground">Retry Verification</CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 -mr-2"><X className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">BVN</label>
                            <Input placeholder="12345678901" {...register('bvn')} className="bg-muted/50 border-input rounded-xl" />
                            {errors.bvn && <p className="text-[10px] text-destructive">{errors.bvn.message as string}</p>}
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Date of Birth</label>
                            <Input type="date" {...register('dob')} className="bg-muted/50 border-input rounded-xl" />
                            {errors.dob && <p className="text-[10px] text-destructive">{errors.dob.message as string}</p>}
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full rounded-xl">
                            {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Submit'}
                        </Button>
                    </form>
                </CardContent>
             </Card>
          );
      }

      return (
        <StatusInfoCard 
            icon={AlertTriangle}
            title="Verification Failed"
            description={`Issue: ${user.kycRejectionReason || 'Details did not match records.'} Please ensure your details match your government ID exactly.`}
            statusColor="bg-destructive/5 border-destructive/20 text-destructive"
            buttonText="Try Again"
            onAction={() => setShowForm(true)}
        />
      );
  }

  // 5. Default: Unverified (Tier 0)
  if (showForm) {
    return (
        <Card className="border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-2">
            <CardHeader className="pb-4 border-b border-border/40 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-base text-foreground">Identity Verification (Tier 1)</CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-1">Enter your BVN to verify your identity.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 -mr-2"><X className="h-4 w-4" /></Button>
            </CardHeader>
            <CardContent className="pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Bank Verification Number (BVN)</label>
                    <div className="relative">
                    <Input 
                        placeholder="12345678901" 
                        {...register('bvn')} 
                        type="password" 
                        className="bg-muted/50 border-input rounded-xl pr-10 tracking-widest font-mono h-11"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50">
                        <Lock className="h-4 w-4" />
                    </div>
                    </div>
                    {errors.bvn && <p className="text-[10px] text-destructive">{errors.bvn.message as string}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Date of Birth</label>
                    <div className="relative">
                        <Input 
                            type="date" 
                            {...register('dob')} 
                            className="bg-muted/50 border-input rounded-xl h-11 pl-10"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Must match your BVN record exactly.</p>
                    {errors.dob && <p className="text-[10px] text-destructive">{errors.dob.message as string}</p>}
                </div>

                <div className="pt-2">
                    <Button type="submit" disabled={isLoading} className="w-full rounded-xl shadow-lg shadow-primary/20 h-11">
                        {isLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
                        {isLoading ? 'Verifying...' : 'Verify Identity'}
                    </Button>
                </div>
                </form>
            </CardContent>
        </Card>
    );
  }

  // Initial State: Unverified Info Card
  return (
    <StatusInfoCard 
        icon={Shield}
        title="Verification Required"
        description="To enable withdrawals and virtual cards, we need to verify your identity. This is a one-time process."
        statusColor="bg-amber-500/5 border-amber-500/20 text-amber-500"
        buttonText="Start Verification"
        onAction={() => setShowForm(true)}
    />
  );
}