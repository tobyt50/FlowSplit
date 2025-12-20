'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../lib/authStore';
import { updateUserProfile } from '../../../../lib/userService';
import { getWallets } from '../../../../lib/walletService';
import { Wallet } from '../../../../types/index';
import { Button } from '../../../../components/ui/Button';
import { Switch } from '../../../../components/ui/Switch';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../../components/ui/DropdownMenu';
import { ChevronDown, Loader2, ZapOff, Zap } from 'lucide-react';
import { toast } from 'sonner';

export function AutomationPreferences() {
  const { user, setUser } = useAuthStore();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const safeUser = user as any;
  const currentOverrideId = safeUser?.depositOverrideWalletId;
  const isOverrideEnabled = !!currentOverrideId;

  useEffect(() => {
    getWallets().then(setWallets);
  }, []);

  const handleToggle = async (enabled: boolean) => {
    const walletIdToSet = enabled 
        ? (currentOverrideId || wallets[0]?.id) 
        : null;

    if (enabled && !walletIdToSet) {
        toast.error("You need at least one wallet to enable this feature.");
        return;
    }

    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile({ depositOverrideWalletId: walletIdToSet });
      setUser(updatedUser);
      toast.success(enabled ? 'Automation Paused. Override Enabled.' : 'Automation Resumed.');
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletSelect = async (walletId: string) => {
    setIsLoading(true);
    try {
      const updatedUser = await updateUserProfile({ depositOverrideWalletId: walletId });
      setUser(updatedUser);
      toast.success('Target wallet updated.');
    } catch (err: any) {
      toast.error('Update Failed', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedWalletName = wallets.find(w => w.id === currentOverrideId)?.name;

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            Pause Split Automation
          </label>
          <p className="text-xs text-muted-foreground">
            Bypass all split rules and route 100% of deposits to a single wallet.
          </p>
        </div>
        <Switch
          checked={isOverrideEnabled}
          onCheckedChange={handleToggle}
          disabled={isLoading}
        />
      </div>

      {/* Target Wallet Selection (Only visible if enabled) */}
      {isOverrideEnabled && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
           <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 space-y-4">
              <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500 shrink-0">
                      <ZapOff className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-amber-500">Automation is Paused</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                          Your split rules are currently being ignored. All incoming funds are being routed to the wallet selected below.
                      </p>
                  </div>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider pl-1">Target Wallet</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild disabled={isLoading}>
                        <Button variant="outline" className="w-full justify-between bg-background border-amber-500/30 h-11 rounded-xl hover:bg-amber-500/10 hover:border-amber-500/50 hover:text-foreground">
                            {selectedWalletName || "Select Wallet"}
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4 opacity-50" />}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] bg-popover border-border rounded-xl">
                        {wallets.map(w => (
                        <DropdownMenuItem key={w.id} onSelect={() => handleWalletSelect(w.id)} className="cursor-pointer rounded-lg my-0.5">
                            {w.name} <span className="ml-2 text-xs text-muted-foreground">({w.type})</span>
                        </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}