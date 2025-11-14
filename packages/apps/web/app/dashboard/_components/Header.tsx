'use client';

import React from 'react';
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

export function Header() {
  // Access the user data and logout function from our global store and service
  const { user } = useAuthStore();
  const handleLogout = () => {
    logoutUser();
  };

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* A placeholder for the mobile sidebar toggle */}
      {/* We will implement this later */}
      <div className="md:hidden">
          {/* Mobile Nav Toggle Icon */}
      </div>

      <div className="w-full flex-1">
        {/* Optional: Add a search bar or other header content here */}
      </div>

      {/* Theme Toggle Button */}
      <ThemeToggle />

      {/* User Dropdown Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {/* Display user's full name if available */}
            {user?.fullName || 'My Account'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}