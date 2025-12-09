import React from 'react';
import { cn } from '../../lib/utils';
import { VirtualCard } from '../../types/index';
import { Wifi } from 'lucide-react';

interface CreditCardProps {
  card: VirtualCard;
  className?: string;
}

export function CreditCard({ card, className }: CreditCardProps) {
  const isFrozen = card.status === 'FROZEN' || card.status === 'INACTIVE';
  
  // Sleek dark metallic gradient for active cards
  const bgClass = isFrozen 
    ? "bg-slate-800 grayscale opacity-80" 
    : "bg-gradient-to-bl from-slate-900 via-[#0f172a] to-black";

  return (
    <div className={cn(
      "relative w-full aspect-[1.586/1] rounded-3xl p-6 text-white shadow-2xl overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/5 border border-white/5",
      bgClass,
      className
    )}>
      {/* --- Aesthetic Overlays --- */}
      
      {/* 1. Noise/Grain Texture (Optional feel) */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      
      {/* 2. Abstract Glows */}
      <div className="absolute -top-[40%] -right-[40%] w-[80%] h-[80%] rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[40%] -left-[40%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[80px] pointer-events-none" />
      
      {/* 3. Glossy Sheen */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-50 pointer-events-none" />

      {/* --- Card Content --- */}
      <div className="relative z-10 flex flex-col h-full justify-between select-none">
        
        {/* Header: Chip & NFC */}
        <div className="flex justify-between items-start">
          {/* Realistic Chip Styling */}
          <div className="w-12 h-9 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 border border-yellow-600/50 shadow-sm relative overflow-hidden">
             <div className="absolute inset-0 border-r border-black/20 w-1/3 left-0" />
             <div className="absolute inset-0 border-l border-black/20 w-1/3 right-0" />
             <div className="absolute top-1/2 w-full h-[1px] bg-black/20" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-3 border border-black/20 rounded-[1px]" />
          </div>
          
          <Wifi className="h-6 w-6 text-white/50 rotate-90" />
        </div>

        {/* Card Number */}
        <div className="mt-4">
          <div className="flex gap-3 text-xl sm:text-2xl font-mono font-medium tracking-widest text-white/90 drop-shadow-md">
            <span>****</span>
            <span>****</span>
            <span>****</span>
            <span className="text-white">{card.last4}</span>
          </div>
        </div>

        {/* Footer: Info & Brand */}
        <div className="flex justify-between items-end">
          <div className="space-y-1.5">
            <div className="flex flex-col">
                <span className="text-[9px] uppercase text-white/40 tracking-widest font-bold">Cardholder</span>
                <span className="font-medium tracking-wide uppercase truncate max-w-[160px] text-sm text-white/90">
                    {card.nameOnCard}
                </span>
            </div>
            <div className="flex gap-4">
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-white/40 tracking-widest font-bold">Expires</span>
                    <span className="font-mono text-sm text-white/90">
                        {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
                    </span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] uppercase text-white/40 tracking-widest font-bold">CVC</span>
                    <span className="font-mono text-sm text-white/90">***</span>
                </div>
            </div>
          </div>

          <div className="flex flex-col items-end pb-1">
             {/* Brand Logo Logic */}
             {card.brand.toLowerCase() === 'visa' ? (
                 <span className="font-black italic text-3xl tracking-tighter text-white/90">VISA</span>
             ) : (
                 // CSS Mastercard Circles
                 <div className="flex relative items-center">
                    {/* Red Circle */}
                    <div className="w-8 h-8 rounded-full bg-[#EB001B] z-10 mix-blend-hard-light shadow-sm"></div>
                    {/* Orange/Yellow Circle */}
                    <div className="w-8 h-8 rounded-full bg-[#F79E1B] -ml-3.5 z-0 shadow-sm"></div>
                 </div>
             )}
          </div>
        </div>
      </div>
      
      {/* Frozen Status Overlay */}
      {isFrozen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/40 transition-all">
              <div className="border border-white/20 bg-black/50 px-6 py-2 rounded-xl backdrop-blur-md shadow-2xl">
                  <span className="text-sm font-bold uppercase tracking-[0.3em] text-white">
                      FROZEN
                  </span>
              </div>
          </div>
      )}
    </div>
  );
}