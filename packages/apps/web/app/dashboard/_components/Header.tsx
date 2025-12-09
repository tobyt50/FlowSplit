'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Button } from '../../../components/ui/Button';
import { 
  Search, 
  CircleUser, 
  ChevronDown, 
  Plus, 
  History, 
  Settings, 
  User, 
  CreditCard, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../../lib/authStore';
import { logoutUser } from '../../../lib/authService';
import { NotificationsBell } from './NotificationsBell';

export function Header() {
  const { user } = useAuthStore();
  
  const handleLogout = () => {
    logoutUser();
  };

  const handleOpenDeposit = () => {
    document.dispatchEvent(new CustomEvent('open-add-funds-modal'));
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center gap-4 bg-background/80 px-4 md:px-6 backdrop-blur-xl transition-all border-b border-border/40 md:border-none">
      
      <div className="flex items-center gap-2 md:hidden">
        <div className="relative h-7 w-7 overflow-hidden rounded-[8px]">
             <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" />
        </div>
        <span className="text-lg tracking-wide font-bold transition-colors">
            <span className="text-foreground">Flow</span>
            <span className="text-teal-500">Split</span>
        </span>
      </div>

      <div className="hidden md:flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Welcome back, {user?.fullName?.split(' ')[0]}</p>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2 md:gap-3">
        <div className="hidden md:flex items-center rounded-full bg-secondary/50 px-4 py-2.5 transition-colors hover:bg-secondary border border-transparent hover:border-border/50">
          <Search className="mr-2 h-4 w-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-24 lg:w-36 text-foreground"
          />
          <span className="ml-2 flex h-5 w-5 items-center justify-center rounded border border-border bg-background text-[10px] font-medium text-muted-foreground">⌘K</span>
        </div>

        <Button
          onClick={handleOpenDeposit}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/20 hidden md:flex items-center gap-2 h-10 px-4"
        >
          <Plus className="h-4 w-4" />
          <span>Deposit</span>
        </Button>

        <div className="flex items-center gap-1">
          <NotificationsBell />
          
          {/* Cards Page Link (Replaces Theme Toggle) */}
          <Button
            variant="outline"
            size="icon"
            asChild
            className="rounded-xl border-border bg-background/50 backdrop-blur-md hover:bg-muted hover:text-foreground"
          >
            <Link href="/dashboard/cards" title="Virtual Cards">
              <CreditCard className="h-5 w-5 text-foreground" />
              <span className="sr-only">Virtual Cards</span>
            </Link>
          </Button>
        </div>

        <div className="h-8 w-px bg-border/50 mx-1 hidden md:block"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex items-center gap-2 rounded-full pl-1 pr-1 md:pr-3 py-1 hover:bg-secondary/50 transition-all outline-none">
              <div className="relative h-8 w-8 md:h-10 md:w-10 overflow-hidden rounded-full border-2 border-background shadow-sm">
                {user?.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.fullName} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                    <CircleUser className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="hidden text-left md:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground leading-none max-w-[100px] truncate">
                    @{user?.fullName?.replace(/\s/g, '').toLowerCase() || 'user'}
                  </span>
                  <span className="rounded-[4px] bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">PRO</span>
                </div>
              </div>
              <ChevronDown className="hidden md:block h-4 w-4 text-muted-foreground opacity-50 group-hover:opacity-100" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 rounded-xl border-border bg-card/95 backdrop-blur-lg">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer rounded-lg">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
            </DropdownMenuItem>

            {/* --- MOBILE ONLY QUICK-LINKS --- */}
            <div className="md:hidden">
              <DropdownMenuItem asChild>
                <Link href="/dashboard/transactions" className="cursor-pointer">
                  <History className="mr-2 h-4 w-4" />
                  <span>History</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
            </div>
            
            <DropdownMenuItem className="cursor-pointer rounded-lg">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
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