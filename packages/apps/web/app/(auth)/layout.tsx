import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Updated background to match the dashboard's deep dark theme
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2 bg-background">
      
      {/* 
        LEFT COLUMN: Graphics Banner 
        - Hidden on mobile/tablet (lg:flex).
        - Deepened overlay for better contrast with white text/logo.
      */}
      <div className="relative hidden h-full flex-col bg-zinc-900 p-10 text-white dark:border-r border-border/50 lg:flex">
        
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0">
          <Image 
            src="/images/landing-hero.png" 
            alt="FlowSplit Background" 
            fill 
            className="object-cover" 
            priority
          />
          {/* Gradient mix to blend image with the deep navy theme */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-900/40 to-black/80 mix-blend-multiply" />
        </div>

        {/* Center Logo Area with Double Cascading Overlay */}
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="relative flex h-40 w-full max-w-md items-center justify-center">
             
             {/* Layer 1: Deep Echo (Blurred & Offset) */}
             <div className="absolute inset-0 translate-x-4 translate-y-4 opacity-10 blur-[3px]">
               <Image 
                 src="/images/logo-text.png" 
                 alt="FlowSplit Shadow" 
                 fill
                 className="object-contain"
               />
             </div>

             {/* Layer 2: Near Echo (Sharper & Semi-transparent) */}
             <div className="absolute inset-0 translate-x-2 translate-y-2 opacity-30 mix-blend-overlay">
               <Image 
                 src="/images/logo-text.png" 
                 alt="FlowSplit Echo" 
                 fill
                 className="object-contain"
               />
             </div>

             {/* Layer 3: Main Logo (Crisp & Front) */}
             <div className="relative z-10 h-full w-full drop-shadow-2xl">
               <Image 
                 src="/images/logo-text.png" 
                 alt="FlowSplit" 
                 fill
                 className="object-contain"
                 priority
               />
             </div>

          </div>
        </div>

        {/* Bottom Quote */}
        <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg font-medium leading-relaxed text-slate-200">
                &ldquo;Stop guessing. Start splitting. Take control of your money from the moment it arrives.&rdquo;
              </p>
            </blockquote>
        </div>
      </div>

      {/* 
        RIGHT COLUMN: Form Content 
        - Centered flex container.
        - Inherits bg-background from main.
      */}
      <div className="flex items-center justify-center p-4 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
          {children}
        </div>
      </div>
    </main>
  );
}