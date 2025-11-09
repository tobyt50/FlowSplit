import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../styles/globals.css'; // Your global stylesheet
import { cn } from '../lib/utils'; // A utility for merging class names

// Using next/font to automatically optimize and load the Inter font.
// This is a significant performance and DX improvement.
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans', // Define it as a CSS variable for Tailwind
  weight: ['400', '500', '600'], // Load the required font weights
});

export const metadata: Metadata = {
  title: 'FlowSplit - Smart Money Routing',
  description:
    'Automate your finances. Split your income into smart wallets effortlessly.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          fontSans.variable
        )}
      >
        {/* We will wrap this with Theme and Auth providers later */}
        {children}
      </body>
    </html>
  );
}