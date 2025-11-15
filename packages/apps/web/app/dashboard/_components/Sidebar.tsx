'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../../../lib/utils';
import { Home, Wallet, SlidersHorizontal, Settings, History } from 'lucide-react'; // Import necessary icons

const navItems = [
  { href: '/dashboard/overview', label: 'Overview', icon: Home },
  { href: '/dashboard/transactions', label: 'Transactions', icon: History },
  { href: '/dashboard/wallets', label: 'Wallets', icon: Wallet },
  { href: '/dashboard/rules', label: 'Split Rules', icon: SlidersHorizontal },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-xl text-primary">FlowSplit</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {navItems.map((item) => {
              // The key change: We now check if the current pathname STARTS WITH the item's href.
              // This ensures parent links stay active for child routes.
              // The one exception is the overview page, which should be an exact match.
              const isActive = item.href === '/dashboard/overview' 
                ? pathname === item.href 
                : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    { 'bg-muted text-primary': isActive }
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}