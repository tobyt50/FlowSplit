import React from 'react';
import Image from 'next/image';

/**
 * AuthLayout provides a consistent visual structure for all authentication-related pages.
 * It features a two-column design on larger screens:
 * - The left side displays a branded, visually appealing graphic.
 * - The right side provides a clean, centered space for the form (e.g., Login, Register).
 * On mobile, the graphic is hidden, and the form takes center stage.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* Left Column: Form Content */}
      <div className="flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right Column: Branding / Image */}
      <div className="hidden bg-muted lg:flex flex-col items-center justify-center p-8">
        <div className="relative w-full max-w-md aspect-square">
           {/* You can replace this with a more sophisticated logo or graphic */}
          <div className="flex items-center justify-center w-full h-full bg-primary/10 rounded-2xl">
              <span className="text-4xl font-bold text-primary">FlowSplit</span>
          </div>
        </div>
        <div className="mt-8 text-center max-w-md">
            <h2 className="text-2xl font-semibold">Automate Your Finances</h2>
            <p className="text-muted-foreground mt-2">
                Stop guessing. Start splitting. Take control of your money from the moment it arrives.
            </p>
        </div>
      </div>
    </main>
  );
}