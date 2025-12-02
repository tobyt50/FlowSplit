'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../../lib/authStore';
import { updateUserProfile } from '../../../lib/userService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { toast } from 'sonner';
import { User, Mail, Loader2, Save } from 'lucide-react';

// Validation Schema
const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

type FormData = z.infer<typeof formSchema>;

// --- Sub-Component: User Profile Form ---
function UserProfileForm() {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  useEffect(() => {
    reset({ fullName: user?.fullName || '' });
  }, [user, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile(data);
      setUser(updatedUser);
      toast.success('Profile updated successfully!');
      // Reset isDirty state by re-initializing with new values
      reset({ fullName: updatedUser.fullName });
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      
      {/* Full Name Field */}
      <div className="space-y-2">
        <label htmlFor="fullName" className="text-sm font-medium text-foreground flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            Full Name
        </label>
        <Input 
            id="fullName" 
            {...register('fullName')} 
            disabled={isLoading} 
            className="bg-muted/50 border-input transition-all focus:bg-background"
        />
        {errors.fullName && <p className="text-destructive text-xs">{errors.fullName.message}</p>}
      </div>

      {/* Email Field (Read Only) */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Email Address
        </label>
        <div className="relative">
            <Input 
                id="email" 
                value={user?.email || ''} 
                disabled 
                className="bg-muted/30 border-dashed border-border text-muted-foreground cursor-not-allowed pl-3" 
            />
        </div>
        <p className="text-[10px] text-muted-foreground px-1">
            Email address is managed by your identity provider and cannot be changed here.
        </p>
      </div>

      {/* Actions */}
      <div className="pt-4 flex justify-end">
        <Button 
            type="submit" 
            disabled={isLoading || !isDirty}
            className="w-full sm:w-auto rounded-xl"
        >
          {isLoading ? (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : (
            <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

// --- Main Settings Page ---
export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-xs text-muted-foreground max-w-md">
          Manage your account preferences and profile details.
        </p>
      </div>
      
      {/* Main Content Area */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Profile Card (Takes up 2 cols on large screens) */}
        <div className="lg:col-span-2">
            <Card className="border-border bg-card">
                <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-base">Profile Information</CardTitle>
                    <CardDescription className="text-xs">
                        Update your personal identification details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <UserProfileForm />
                </CardContent>
            </Card>
        </div>

        {/* Future Settings Placeholder (e.g. Preferences/Security) */}
        <div className="lg:col-span-1 space-y-6">
            <Card className="border-border bg-card/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base text-muted-foreground">Appearance</CardTitle>
                    <CardDescription className="text-xs">
                        Customize your dashboard experience.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground italic">
                        Theme toggles are available in the top navigation bar.
                    </p>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}