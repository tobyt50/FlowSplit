import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* 
        LEFT COLUMN: Graphics Banner 
        - Hidden on mobile (lg:flex).
        - Uses relative positioning to contain the fill image.
      */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        
        {/* 1. The Background Image */}
        <div className="absolute inset-0">
          <Image 
            src="/images/landing-hero.png" 
            alt="FlowSplit Background" 
            fill 
            className="object-cover" 
            priority // Load this immediately as it's above the fold
          />
          {/* 2. Dark Overlay: Ensures text/logo visibility on top of any image */}
          <div className="absolute inset-0 bg-zinc-900/40 mix-blend-multiply" />
        </div>

        {/* 3. The Logo Overlay */}
<div className="absolute inset-0 z-20 flex items-center justify-center">
  <div className="flex items-center gap-2">
    <Image 
      src="/images/logo-text.png" 
      alt="FlowSplit" 
      width={200} 
      height={200} 
      className="h-200 w-auto rounded-2xl"
    />
  </div>
</div>


        {/* Optional: Quote or Marketing Text at the bottom */}
        <div className="relative z-20 mt-auto">
            <p className="text-lg text-center">
              Stop guessing. Start splitting. Take control of your money from the moment it arrives.
            </p>
        </div>
      </div>

      {/* 
        RIGHT COLUMN: Form Content 
        - Centered flex container.
      */}
      <div className="flex items-center justify-center p-8 lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          {children}
        </div>
      </div>
    </main>
  );
}