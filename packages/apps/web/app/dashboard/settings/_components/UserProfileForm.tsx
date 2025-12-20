'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../../../lib/authStore';
import { updateUserProfile } from '../../../../lib/userService';
import { Button } from '../../../../components/ui/Button';
import { Input } from '../../../../components/ui/Input';
import { toast } from 'sonner';
import { 
  User, 
  Mail, 
  Loader2, 
  Save, 
  MapPin, 
  Phone, 
  Globe, 
  Pencil, 
  X, 
  Calendar,
  Building2,
  Map,
  Hash
} from 'lucide-react';
import { Separator } from '../../../../components/ui/Separator';

const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Enter a valid phone number (e.g. +234...)').optional().or(z.literal('')),
  dateOfBirth: z.string().min(1, 'Date of birth is required for card issuance.').optional().or(z.literal('')),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().max(2, 'Use 2-letter ISO code').optional(),
});

type FormData = z.infer<typeof formSchema>;

const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  try {
    return new Date(date).toISOString().split('T')[0];
  } catch (error) {
    return '';
  }
};

export function UserProfileForm() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const safeUser = user as any;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: safeUser?.fullName || '',
      phone: safeUser?.phone || '',
      dateOfBirth: formatDateForInput(safeUser?.dateOfBirth),
      addressLine1: safeUser?.addressLine1 || '',
      city: safeUser?.city || '',
      state: safeUser?.state || '',
      postalCode: safeUser?.postalCode || '',
      country: safeUser?.country || 'NG',
    },
  });

  useEffect(() => {
    if (!isEditing) {
      reset({
        fullName: safeUser?.fullName || '',
        phone: safeUser?.phone || '',
        dateOfBirth: formatDateForInput(safeUser?.dateOfBirth),
        addressLine1: safeUser?.addressLine1 || '',
        city: safeUser?.city || '',
        state: safeUser?.state || '',
        postalCode: safeUser?.postalCode || '',
        country: safeUser?.country || 'NG',
      });
    }
  }, [safeUser, reset, isEditing]);

  const onCancel = () => {
    setIsEditing(false);
    reset();
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      const payload: any = { ...data };
      if (data.dateOfBirth) {
        payload.dateOfBirth = new Date(data.dateOfBirth);
      }

      const updatedUser = await updateUserProfile(payload);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = `transition-all duration-200 ${
    isEditing 
      ? 'bg-background border-input' 
      : 'bg-muted/30 border-transparent cursor-default focus-visible:ring-0 px-0 shadow-none'
  }`;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Personal Details</h3>
        {!isEditing ? (
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsEditing(true)}
            className="text-primary hover:text-primary hover:bg-primary/10"
          >
            <Pencil className="h-3.5 w-3.5 mr-2" /> Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={onCancel}
                disabled={isLoading}
            >
                <X className="h-3.5 w-3.5 mr-2" /> Cancel
            </Button>
            <Button 
                type="submit" 
                size="sm" 
                disabled={isLoading}
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> : <Save className="h-3.5 w-3.5 mr-2" />}
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" /> Full Name
            </label>
            <Input 
                id="fullName" 
                {...register('fullName')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
            {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
        </div>

        <div className="space-y-2">
            <label htmlFor="dateOfBirth" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" /> Date of Birth
            </label>
            <Input 
                id="dateOfBirth"
                type="date"
                {...register('dateOfBirth')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
            {errors.dateOfBirth && <p className="text-destructive text-xs">{errors.dateOfBirth.message}</p>}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> Phone Number
            </label>
            <Input 
                id="phone" 
                placeholder="+234..."
                {...register('phone')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
            {errors.phone && <p className="text-destructive text-xs">{errors.phone.message}</p>}
        </div>

        <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" /> Email Address
            </label>
            <Input 
                id="email" 
                value={safeUser?.email || ''} 
                disabled 
                className="bg-muted/50 border-dashed border-border text-muted-foreground cursor-not-allowed" 
            />
        </div>
      </div>

      <Separator className="my-6" />

      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Billing Address</h3>

      <div className="space-y-2">
        <label htmlFor="addressLine1" className="text-sm font-medium text-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" /> Street Address
        </label>
        <Input 
            id="addressLine1" 
            {...register('addressLine1')} 
            disabled={!isEditing || isLoading} 
            className={inputClass}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
            <label htmlFor="city" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" /> City
            </label>
            <Input 
                id="city" 
                {...register('city')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
        </div>

        <div className="space-y-2">
            <label htmlFor="state" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Map className="h-4 w-4 text-muted-foreground" /> State / Province
            </label>
            <Input 
                id="state" 
                {...register('state')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
        </div>

        <div className="space-y-2">
            <label htmlFor="postalCode" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" /> Postal Code
            </label>
            <Input 
                id="postalCode" 
                {...register('postalCode')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
        </div>

        <div className="space-y-2">
            <label htmlFor="country" className="text-sm font-medium text-foreground flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" /> Country (ISO Code)
            </label>
            <Input 
                id="country" 
                placeholder="NG"
                maxLength={2}
                {...register('country')} 
                disabled={!isEditing || isLoading} 
                className={inputClass}
            />
        </div>
      </div>
    </form>
  );
}