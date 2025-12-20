'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { generate2FA, enable2FA, disable2FA } from '../../../../lib/authService';
import { useAuthStore } from '../../../../lib/authStore';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../../components/ui/Card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/Dialog';
import { AlertTriangle, CheckCircle2, Copy, Loader2, QrCode, ShieldCheck, ShieldAlert, XCircle, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

// --- SUB-COMPONENT: DISABLE MODAL ---
function Disable2FAModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<{ password: string }>({
    resolver: zodResolver(z.object({ password: z.string().min(1, 'Password required') }))
  });

  const onSubmit = async (data: { password: string }) => {
    setIsLoading(true);
    try {
      await disable2FA(data.password);
      toast.success('2FA Disabled Successfully');
      onClose();
      window.location.reload(); 
    } catch (error: any) {
      toast.error('Action Failed', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-destructive flex items-center gap-2 text-base">
            <ShieldAlert className="h-4 w-4" /> Disable Two-Factor Auth
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            This will lower your account security. Confirm with your password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
             <Input 
                type="password" 
                placeholder="Current Password" 
                {...register('password')} 
                className="bg-muted/50 border-input h-9 text-sm"
             />
             {errors.password && <p className="text-[10px] text-destructive">{errors.password.message}</p>}
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>Cancel</Button>
            <Button type="submit" variant="destructive" size="sm" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : 'Disable 2FA'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


// --- MAIN COMPONENT ---
export function TwoFactorSetup() {
  const { user, setUser } = useAuthStore();
  
  // Setup Flow States
  const [step, setStep] = useState<'IDLE' | 'SCAN' | 'SUCCESS'>('IDLE');
  const [isLoading, setIsLoading] = useState(false);
  const [qrData, setQrData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  
  // Disable Flow State
  const [isDisableOpen, setIsDisableOpen] = useState(false);

  // --- LOGIC: ENABLE FLOW ---
  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const data = await generate2FA();
      setQrData(data);
      setStep('SCAN');
    } catch (error: any) {
      toast.error('Failed to start setup', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!qrData || code.length !== 6) return;
    setIsLoading(true);
    try {
      const result = await enable2FA(qrData.secret, code);
      setRecoveryCodes(result.recoveryCodes);
      
      if (user) setUser({ ...user, isTwoFactorEnabled: true });
      
      setStep('SUCCESS');
      toast.success('Two-Factor Authentication Enabled');
    } catch (error: any) {
      toast.error('Verification Failed', { description: 'Invalid code. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const copyCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join('\n'));
    toast.success('Codes copied to clipboard');
  };

  // --- RENDER: ALREADY ENABLED STATE ---
  if (user?.isTwoFactorEnabled) {
    return (
      <>
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4 transition-all hover:bg-green-500/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg text-green-500 shrink-0">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-green-500">2FA is Active</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account is protected by an authenticator app.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive w-full sm:w-auto text-xs h-8"
              onClick={() => setIsDisableOpen(true)}
            >
              Disable
            </Button>
          </div>
        </div>
        <Disable2FAModal isOpen={isDisableOpen} onClose={() => setIsDisableOpen(false)} />
      </>
    );
  }

  // --- RENDER: SETUP FLOW (IDLE) ---
  if (step === 'IDLE') {
    return (
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-border p-4 bg-card hover:bg-muted/10 transition-colors">
        <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h4>
          <p className="text-xs text-muted-foreground mt-0.5">Add extra security with an authenticator app.</p>
        </div>
        <Button onClick={handleStartSetup} disabled={isLoading} size="sm" className="w-full sm:w-auto shadow-sm h-8 text-xs">
          {isLoading ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : 'Enable 2FA'}
        </Button>
      </div>
    );
  }

  // --- RENDER: SETUP FLOW (SCANNING) ---
  if (step === 'SCAN') {
    return (
      <Card className="border-primary/30 bg-card shadow-md animate-in fade-in zoom-in-95">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
             <QrCode className="h-4 w-4 text-primary" /> Scan QR Code
          </CardTitle>
          <CardDescription className="text-xs">Scan this with Google Authenticator or Authy.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center py-4 bg-white rounded-xl border border-white/10 w-fit mx-auto p-4 shadow-inner">
            <img src={qrData?.qrCodeUrl} alt="2FA QR Code" width={140} height={140} className="mix-blend-multiply" />
          </div>
          <div className="space-y-2 text-center">
            <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Verification Code</label>
            <Input 
                placeholder="000000" 
                value={code} 
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="text-center text-xl tracking-[0.3em] font-mono h-10 bg-muted/30 border-border rounded-lg focus:ring-primary/20 w-40 mx-auto"
                autoFocus
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setStep('IDLE')} className="rounded-lg text-xs h-8">Cancel</Button>
            <Button onClick={handleVerify} disabled={isLoading || code.length !== 6} size="sm" className="flex-1 rounded-lg shadow-sm h-8 text-xs">
                {isLoading ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : 'Activate'}
            </Button>
        </CardFooter>
      </Card>
    );
  }

  // --- RENDER: SETUP FLOW (SUCCESS) ---
  if (step === 'SUCCESS') {
    return (
      <Card className="border-green-500/20 bg-green-500/5 animate-in fade-in shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-500 text-sm font-semibold">
            <CheckCircle2 className="h-4 w-4" /> Setup Complete
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground/90">
            Save these recovery codes securely. They are the <strong>only way</strong> to access your account if you lose your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-2 p-3 bg-background/60 border border-green-500/10 rounded-lg font-mono text-xs text-foreground/80">
            {recoveryCodes.map((c, i) => (
                <div key={i} className="text-center py-1 bg-card rounded border border-border/50 select-all">{c}</div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2 pt-0">
            <Button variant="outline" size="sm" className="flex-1 rounded-lg border-green-500/20 hover:bg-green-500/10 hover:text-green-500 h-8 text-xs" onClick={copyCodes}>
                <Copy className="mr-1.5 h-3 w-3" /> Copy Codes
            </Button>
            <Button className="flex-1 rounded-lg h-8 text-xs" size="sm" onClick={() => window.location.reload()}>
                Done
            </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}