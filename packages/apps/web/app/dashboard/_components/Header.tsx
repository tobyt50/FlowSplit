'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { 
  Search, 
  CircleUser, 
  ChevronDown, 
  Plus, 
  History,
  User, 
  CreditCard, 
  LogOut,
  CornerDownLeft,
} from 'lucide-react';
import { useAuthStore } from '../../../lib/authStore';
import { logoutUser } from '../../../lib/authService';
import { useHeaderStore } from '../../../lib/headerStore';
import { NotificationsBell } from './NotificationsBell';

export function Header() {
  const { user } = useAuthStore();
  const { title, badgeCount, badgeLabel, resetHeader } = useHeaderStore();
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    resetHeader();
  }, [pathname, resetHeader]);

  const handleLogout = () => {
    logoutUser();
  };

  const handleOpenDeposit = () => {
    document.dispatchEvent(new CustomEvent('open-add-funds-modal'));
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const getFallbackTitle = () => {
    if (pathname.includes('/overview')) return 'Overview';
    if (pathname.includes('/wallets')) return 'Wallets';
    if (pathname.includes('/cards')) return 'Virtual Cards';
    if (pathname.includes('/rules')) return 'Split Rules';
    if (pathname.includes('/transactions')) return 'Transactions';
    if (pathname.includes('/settings')) return 'Settings';
    if (pathname.includes('/bank-accounts')) return 'Bank Accounts';
    if (pathname.includes('/search')) return 'Search';
    return 'Dashboard';
  };

  const displayTitle = title || getFallbackTitle();
  
  // Logic to construct names from first/last
  const firstName = user?.firstName || 'User';
  const fullName = user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : 'User';

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">
      
      {/* Mobile Logo */}
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative h-7 w-7 overflow-hidden rounded-[8px]">
             <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" />
        </div>
        <span className="text-lg tracking-wide font-bold transition-colors">
            <span className="text-foreground">Flow</span>
            <span className="text-teal-500">Split</span>
        </span>
      </div>

      {/* Desktop Title */}
      <div className="hidden md:flex flex-col">
        <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">{displayTitle}</h1>
            
            {badgeCount !== null && (
                <Badge variant="outline" className="hidden sm:flex bg-muted text-muted-foreground border-border h-5 px-2 text-[10px]">
                    {badgeCount} {badgeLabel || 'Records'}
                </Badge>
            )}
        </div>
      </div>

      <div className="flex-1" />

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        
        {/* Global Search Bar */}
        <div className="hidden md:flex items-center rounded-full bg-secondary/50 px-4 py-2.5 transition-colors hover:bg-secondary border border-transparent hover:border-border/50">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-24 lg:w-36 text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
          <kbd className="ml-2 flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-muted-foreground select-none">
            <CornerDownLeft className="h-3 w-3" />
          </kbd>
        </div>

        {/* Deposit Action */}
        <Button
          onClick={handleOpenDeposit}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hidden md:flex items-center gap-2 h-10 px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Deposit</span>
        </Button>

        {/* Icons Group */}
        <div className="flex items-center gap-1">
          <NotificationsBell />
          
          <Button
            variant="ghost"
            size="icon"
            asChild
            className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <Link href="/dashboard/cards" title="Virtual Cards">
              <CreditCard className="h-5 w-5" />
              <span className="sr-only">Virtual Cards</span>
            </Link>
          </Button>
        </div>

        <div className="h-8 w-px bg-border/50 mx-1 hidden md:block"></div>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={fullName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    <CircleUser className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="hidden text-left md:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground leading-none max-w-[100px] truncate">
                    @{fullName.replace(/\s/g, '').toLowerCase()}
                  </span>
                  <span className="rounded-[4px] bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">PRO</span>
                </div>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl border-border bg-card/95 backdrop-blur-lg">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {/* firstName is correct here */}
                <p className="text-sm font-medium leading-none">Hi, {firstName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer rounded-lg" asChild>
                <Link href="/dashboard/settings">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & KYC</span>
                </Link>
            </DropdownMenuItem>

            <div className="md:hidden">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/transactions" className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <span>History</span>
                </Link>
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuItem className="cursor-pointer rounded-lg" asChild>
                <Link href="/dashboard/bank-accounts">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Bank Accounts</span>
                </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}