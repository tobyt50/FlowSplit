'use client';

import Link from 'next/link';
import { Wallet, WalletType } from '../../../../types/index';
import { Card } from '../../../../components/ui/Card';
import { formatCurrency } from '../../../../lib/walletService';
import { PiggyBank, Landmark, ShieldCheck, ArrowRight } from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { cn } from '../../../../lib/utils';

const getWalletConfig = (type: WalletType) => {
  switch (type) {
    case 'SAVINGS': 
        return { 
            icon: PiggyBank, 
            bg: "bg-amber-500/10", 
            text: "text-amber-500", 
            border: "border-amber-500/20",
            gradient: "from-amber-500/10 to-transparent"
        };
    case 'BILL': 
        return { 
            icon: ShieldCheck, 
            bg: "bg-blue-500/10", 
            text: "text-blue-500", 
            border: "border-blue-500/20",
            gradient: "from-blue-500/10 to-transparent"
        };
    default: 
        return { 
            icon: Landmark, 
            bg: "bg-primary/10", 
            text: "text-primary", 
            border: "border-primary/20",
            gradient: "from-primary/10 to-transparent"
        };
  }
};

export const WalletCard = ({ wallet }: { wallet: Wallet }) => {
  const config = getWalletConfig(wallet.type);
  const Icon = config.icon;

  return (
    <Link href={`/dashboard/wallets/${wallet.id}`} className="block h-full group outline-none">
      <Card className={cn(
          "relative h-[180px] overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card border-border group-hover:border-primary/50",
          "flex flex-col justify-between p-0"
      )}>
        {/* Gradient Background */}
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none", config.gradient)} />
        
        {/* Large Decorative Icon */}
        <Icon className={cn("absolute -bottom-4 -right-4 h-24 w-24 opacity-5 pointer-events-none transition-transform group-hover:scale-110 group-hover:opacity-10", config.text)} />

        <div className="p-5 relative z-10">
            <div className="flex justify-between items-start mb-4">
                <div className={cn("p-2.5 rounded-xl shadow-sm", config.bg, config.text)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background/50 text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
            
            <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{wallet.name}</h3>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                    {formatCurrency(wallet.balance, wallet.currency)}
                </div>
            </div>
        </div>
        
        <div className="px-5 pb-5 relative z-10 flex items-center gap-2">
             <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-background/50 backdrop-blur-sm border border-border/50">
                {wallet.type}
             </Badge>
             {/* Future: Add 'Active Rules' count here if available */}
        </div>
      </Card>
    </Link>
  );
};