'use client';

import React from 'react';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/DropdownMenu';
import { Button } from '../../../components/ui/Button';
import { CircleUser } from 'lucide-react';
import { useAuthStore } from '../../../lib/authStore';
import { logoutUser } from '../../../lib/authService';
import { ThemeToggle } from './ThemeToggle';
import { NotificationsBell } from './NotificationsBell';

export function Header() {
  const { user } = useAuthStore();
  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      <div className="md:hidden">
          {/* Mobile Nav Toggle Icon would go here */}
      </div>

      <div className="flex items-center gap-2 md:hidden">
        <Image 
          src="/images/logo.jpg" 
          alt="FlowSplit" 
          width={32} 
          height={32} 
          className="h-8 w-auto"
        />
      </div>

      <div className="w-full flex-1">
        {/* Search bar placeholder */}
      </div>
      <div className="ml-auto flex items-center gap-3">
      <NotificationsBell />
      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            {user?.avatarUrl ? (
               // If user has a custom avatar (future feature), show it
               <Image 
                 src={user.avatarUrl} 
                 alt={user.fullName} 
                 width={32} 
                 height={32} 
                 className="rounded-full"
               />
            ) : (
               <CircleUser className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {user?.fullName || 'My Account'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
    </header>
  );
}