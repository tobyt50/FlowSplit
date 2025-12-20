'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TierLimit, updateSystemLimit } from '../../../../lib/adminLimitService';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../../components/ui/Card';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { Badge } from '../../../../components/ui/Badge';
import { Separator } from '../../../../components/ui/Separator';
import { Pencil, Save, X, Loader2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface LimitTierCardProps {
  limit: TierLimit;
  onRefresh: () => void;
}

export function LimitTierCard({ limit, onRefresh }: LimitTierCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Convert string BigInts to numbers for the form inputs
  // Note: For very large limits (quadrillions), JS numbers might lose precision, 
  // but for transaction limits, Number.MAX_SAFE_INTEGER is usually sufficient.
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      maxPerTransaction: Number(limit.maxPerTransaction),
      maxDaily: Number(limit.maxDaily),
      maxMonthly: Number(limit.maxMonthly),
    }
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await updateSystemLimit(limit.tier, {
        maxPerTransaction: Number(data.maxPerTransaction),
        maxDaily: Number(data.maxDaily),
        maxMonthly: Number(data.maxMonthly),
      });
      toast.success(`${limit.tier} limits updated successfully.`);
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to format currency for display
  const format = (val: string) => {
    const num = Number(val);
    if (num === -1) return 'Unlimited';
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(num / 100);
  };

  return (
    <Card className={`border-l-4 ${limit.tier === 'TIER_2' ? 'border-l-primary' : 'border-l-muted'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{limit.tier.replace('_', ' ')}</CardTitle>
            {limit.tier === 'TIER_0' && <Badge variant="secondary" className="text-[10px]">Unverified</Badge>}
            {limit.tier === 'TIER_2' && <Badge className="text-[10px] bg-green-600">Verified</Badge>}
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); reset(); }}>
                <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isEditing ? (
          <form id={`form-${limit.tier}`} onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Per Transaction (kobo)</label>
                <Input type="number" {...register('maxPerTransaction')} />
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Daily Limit (kobo)</label>
                <Input type="number" {...register('maxDaily')} />
            </div>
            <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase">Monthly Limit (kobo)</label>
                <Input type="number" {...register('maxMonthly')} />
                <p className="text-[10px] text-muted-foreground mt-1">Enter -1 for Unlimited</p>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Per Transaction</span>
                <span className="font-mono font-medium">{format(limit.maxPerTransaction)}</span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Daily Max</span>
                <span className="font-mono font-medium">{format(limit.maxDaily)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Max</span>
                <span className="font-mono font-medium">{format(limit.maxMonthly)}</span>
            </div>
          </div>
        )}
      </CardContent>

      {isEditing && (
        <CardFooter>
            <Button type="submit" form={`form-${limit.tier}`} className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}