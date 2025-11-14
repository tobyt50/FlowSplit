'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuthStore } from '../../../lib/authStore';
import { updateUserProfile } from '../../../lib/userService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Separator } from '../../../components/ui/Separator';
import { toast } from 'sonner';

// Define the validation schema for the profile form
const formSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
});

type FormData = z.infer<typeof formSchema>;

// A sub-component for the form itself
function UserProfileForm() {
  const { user, setUser } = useAuthStore(); // Get user data and the action to update it
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

  // When the user data in the global store changes, reset the form
  useEffect(() => {
    reset({ fullName: user?.fullName || '' });
  }, [user, reset]);

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile(data);
      setUser(updatedUser); // Update the global state with the new user info
      toast.success('Profile updated successfully!');
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
        <Input id="fullName" {...register('fullName')} disabled={isLoading} className="mt-1" />
        {errors.fullName && <p className="text-destructive text-xs mt-1">{errors.fullName.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="text-sm font-medium">Email Address</label>
        <Input id="email" value={user?.email || ''} disabled className="mt-1 bg-muted/50" />
        <p className="text-xs text-muted-foreground mt-1">Email address cannot be changed.</p>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}


// The main page component for the settings route
export default function SettingsPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences.
        </p>
      </div>
      <Separator />
      
      <div className="max-w-2xl">
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          This is how your name will be displayed in the application.
        </p>
        <div className="mt-6">
          <UserProfileForm />
        </div>
      </div>
    </div>
  );
}