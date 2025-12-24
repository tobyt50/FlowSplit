'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/Card';
import { Shield, Lock, Sliders, User, Palette } from 'lucide-react';
import { ThemeToggle } from '../_components/ThemeToggle';
import { ChangePasswordForm } from './_components/ChangePasswordForm';
import { AutomationPreferences } from './_components/AutomationPreferences';
import { UserProfileForm } from './_components/UserProfileForm';
import { TwoFactorSetup } from './_components/TwoFactorSetup';
import { KycVerification } from './_components/KycVerification';
import { useEffect } from 'react';
import { refreshProfile } from '../../../lib/authService';

export default function SettingsPage() {

  useEffect(() => {
    refreshProfile();
  }, []);

  return (
    <div className="space-y-6 md:space-y-0 animate-in fade-in duration-500 pb-24 md:pb-10">
      
      {/* Page Header */}
      <div className="flex flex-col gap-1 px-1 md:hidden">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
      </div>

      <Tabs defaultValue="profile" className="w-full space-y-6">
        
        {/* Navigation Tabs */}
        <div className="overflow-x-auto pb-2 md:pb-0 -mx-4 px-2 md:mx-0 md:px-0">
          <TabsList className="w-full justify-start md:w-auto inline-flex h-11 items-center rounded-xl bg-muted/50 p-1 text-muted-foreground">
            <TabsTrigger value="profile" className="rounded-lg px-4 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <User className="mr-1 h-4 w-4" /> Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-lg px-4 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Lock className="mr-1 h-4 w-4" /> Security
            </TabsTrigger>
            <TabsTrigger value="preferences" className="rounded-lg px-4 text-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                <Sliders className="mr-1 h-4 w-4" /> Preferences
            </TabsTrigger>
          </TabsList>
        </div>

        {/* --- TAB 1: PROFILE --- */}
        <TabsContent value="profile" className="space-y-6 focus-visible:outline-none">
          <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-base">Profile</CardTitle>
                  <CardDescription className="text-xs">
                    Keep your details up to date for verification and card issuance.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <UserProfileForm />
                </CardContent>
              </Card>
            </div>
            
            {/* KYC SECTION */}
            <div className="lg:col-span-1 space-y-6">
                 <KycVerification />

                 <Card className="bg-primary/5 border-dashed border-primary/20">
                    <CardHeader className="p-5">
                        <CardTitle className="text-sm flex items-center gap-2 text-primary">
                            <Shield className="h-4 w-4" /> Why this matters
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed mt-2 text-muted-foreground/80">
                            Financial regulations require us to verify the identity of all users before processing withdrawals or issuing virtual cards. Your data is encrypted and stored securely using bank-grade standards.
                        </CardDescription>
                    </CardHeader>
                 </Card>
            </div>
          </div>
        </TabsContent>

        {/* --- TAB 2: SECURITY --- */}
        <TabsContent value="security" className="space-y-6 focus-visible:outline-none">
            {/* Section 1: Password Management */}
            <Card className="border-border bg-card shadow-sm">
                <CardHeader className="pb-4 border-b border-border/40">
                    <CardTitle className="text-base">Password</CardTitle>
                    <CardDescription className="text-xs">Update your login credentials.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <ChangePasswordForm />
                </CardContent>
            </Card>

            {/* Section 2: Two-Factor Authentication */}
            <div className="space-y-4">
                <TwoFactorSetup />
            </div>
        </TabsContent>

        {/* --- TAB 3: PREFERENCES --- */}
        <TabsContent value="preferences" className="space-y-6 focus-visible:outline-none">
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                
                {/* Theme Settings */}
                <Card className="border-border bg-card shadow-sm h-full flex flex-col">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <CardTitle className="text-base">Appearance</CardTitle>
                        <CardDescription className="text-xs">Customize your dashboard experience.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                                    <Palette className="h-4 w-4 text-muted-foreground" />
                                    Interface Theme
                                </label>
                                <p className="text-xs text-muted-foreground">Toggle between Light, Dark, or System.</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </CardContent>
                </Card>

                {/* Automation Preferences */}
                <Card className="border-border bg-card shadow-sm h-full flex flex-col">
                    <CardHeader className="pb-4 border-b border-border/40">
                        <CardTitle className="text-base">Automation</CardTitle>
                        <CardDescription className="text-xs">Configure global rules for your incoming deposits.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <AutomationPreferences />
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}