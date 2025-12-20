import Link from 'next/link';
import { Button } from '../components/ui/Button';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4 text-foreground">
      
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 blur-[100px] rounded-full opacity-20 pointer-events-none" />

      {/* Glass Card Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
        
        {/* Icon Box */}
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-muted/30 border border-white/5 shadow-inner">
          <FileQuestion className="h-10 w-10 text-muted-foreground opacity-80" />
        </div>

        {/* Typography */}
        <h1 className="text-6xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-foreground to-foreground/50">
          404
        </h1>
        <h2 className="mt-2 text-xl font-semibold text-foreground">Page Not Found</h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Sorry, we couldn't find the page you're looking for. It might have been moved or doesn't exist.
        </p>

        {/* Action Buttons */}
        <div className="mt-8 flex w-full flex-col sm:flex-row gap-3">
          <Button asChild className="flex-1 rounded-xl h-11 shadow-lg shadow-primary/20" variant="default">
            <Link href="/dashboard/overview">
               <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
            </Link>
          </Button>
          <Button asChild className="flex-1 rounded-xl h-11 bg-background/50 border-border" variant="outline">
            <Link href="/">
               <Home className="mr-2 h-4 w-4" /> Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}