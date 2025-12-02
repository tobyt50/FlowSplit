'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { 
  Home, 
  Wallet, 
  SlidersHorizontal, 
  Settings, 
  History, 
  Sparkles,
  ArrowRight,
  Landmark,
  Plus
} from 'lucide-react';

// This remains the source of truth for the DESKTOP sidebar
const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: Home },
  { href: '/dashboard/transactions', label: 'History', icon: History },
  { href: '/dashboard/wallets', label: 'Wallets', icon: Wallet },
  { href: '/dashboard/rules', label: 'Rules', icon: SlidersHorizontal },
  { href: '/dashboard/bank-accounts', label: 'Bank', icon: Landmark },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

// NEW: A separate, filtered list specifically for the mobile dock
const mobileDockItems = navItems.filter(
    item => item.label !== 'History' && item.label !== 'Settings'
);

export function Sidebar() {
  const pathname = usePathname();

  const handleOpenDeposit = () => {
    document.dispatchEvent(new CustomEvent('open-add-funds-modal'));
  };

  // Sliced from the new, shorter mobileDockItems array
  const mobileLeftItems = mobileDockItems.slice(0, 2); // Overview, Wallets
  const mobileRightItems = mobileDockItems.slice(2, 4); // Rules, Bank

  const renderMobileNavItem = (item: any) => {
    const isActive = item.href === '/dashboard/overview' 
      ? pathname === item.href 
      : pathname.startsWith(item.href);
    
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex flex-col items-center justify-center p-1 rounded-lg transition-all w-16",
          isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <item.icon className={cn("h-5 w-5 mb-0.5", isActive && "fill-current/20")} />
        <span className="text-[10px] font-medium text-center">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR (Unchanged) --- */}
      <div className="hidden md:block sticky top-4 h-[calc(100vh-2rem)] ml-4 rounded-3xl bg-background/95 backdrop-blur-xl overflow-hidden z-40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] ring-1 ring-black/5 dark:ring-white/10">
        <div className="flex h-full flex-col gap-4">
          <div className="flex h-[80px] items-center px-6">
            <Link href="/dashboard" className="flex items-center gap-3 font-semibold group">
               <div className="relative h-8 w-8 overflow-hidden rounded-xl border border-border shadow-lg shadow-primary/10 transition-transform duration-300 group-hover:scale-105">
                 <Image src="/images/logo.jpg" alt="FlowSplit" fill className="object-cover" priority />
               </div>
              <div className="flex flex-col">
                  <span className="text-lg text-foreground tracking-wide font-bold group-hover:text-primary transition-colors">FlowSplit</span>
                  <span className="text-xs text-muted-foreground">Finance Manager</span>
              </div>
            </Link>
          </div>
          <div className="flex-1 px-4 py-2">
            <nav className="grid items-start gap-2 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = item.href === '/dashboard/overview' ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn( 'group flex items-center gap-3 px-4 py-2.5 transition-all duration-300', 'rounded-r-xl rounded-l-sm', isActive ? 'border-l-4 border-primary bg-gradient-to-r from-primary/20 to-transparent text-primary' : 'border-l-4 border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50' )}
                  >
                    <item.icon className={cn("h-5 w-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="p-4 mt-auto">
              <div className="group relative overflow-hidden rounded-t-xl rounded-b-sm border-b-4 border-primary bg-gradient-to-t from-primary/30 to-transparent p-4 transition-all hover:from-primary/40">
                  <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-inner shadow-primary/10">
                          <Sparkles className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Unlock Super</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3 leading-relaxed">Get advanced AI insights & unlimited rules.</p>
                  <button className="flex items-center text-[10px] font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors">Upgrade Now <ArrowRight className="ml-1 h-3 w-3" /></button>
              </div>
          </div>
        </div>
      </div>

      {/* --- MOBILE BOTTOM DOCK (Corrected & Compact) --- */}
      <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 h-16 rounded-2xl bg-background/80 backdrop-blur-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10">
        <nav className="flex items-center justify-between h-full px-2">
          
          <div className="flex flex-1 justify-around">
            {mobileLeftItems.map(renderMobileNavItem)}
          </div>

          <div className="relative -top-5 shrink-0">
            <button 
              onClick={handleOpenDeposit}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/40 ring-4 ring-background transition-transform active:scale-95"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          <div className="flex flex-1 justify-around">
            {mobileRightItems.map(renderMobileNavItem)}
          </div>
        </nav>
      </div>
    </>
  );
}