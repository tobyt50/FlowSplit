'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { ArrowRight, CheckCircle2, Shield, Zap, Smartphone, PieChart } from 'lucide-react';

// --- ANIMATION VARIANTS ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/20">
      
      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <div className="relative h-7 w-7 overflow-hidden rounded-[8px] shadow-sm">
              <Image 
                src="/images/logo.jpg" 
                alt="FlowSplit" 
                fill 
                className="object-cover" 
              />
            </div>
            <span>
              <span className="text-foreground">Flow</span>
              <span className="text-teal">Split</span>
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
        
        <div className="container -mt-12 mx-auto px-6 relative z-10">
          <motion.div 
            className="text-center max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-secondary text-xs font-medium mb-6 text-secondary-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              v1.0 is now live
            </motion.div>
            
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Money Management <br /> on <span className="text-primary">Autopilot</span>.
            </motion.h1>
            
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop manually budgeting. FlowSplit automatically routes your income into smart wallets the second you get paid. Rent, savings, bills—sorted instantly.
            </motion.p>
            
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20">
                  Start Splitting Free <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#demo">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">
                  View Demo
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Abstract Dashboard Visual */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-20 relative mx-auto max-w-5xl rounded-xl border bg-background/50 backdrop-blur-xl shadow-2xl p-2 md:p-4"
          >
            <div className="rounded-lg bg-card border shadow-sm overflow-hidden">
               {/* Mock Header */}
               <div className="h-12 border-b flex items-center px-4 gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20"></div>
                  </div>
               </div>
               {/* Mock Content */}
               <div className="p-8 grid md:grid-cols-3 gap-6">
                  <div className="col-span-2 space-y-4">
                    <div className="h-32 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-primary">₦1,500,000</span>
                        <span className="text-sm text-muted-foreground">Income Processed</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="h-24 rounded-lg bg-muted/50 border"></div>
                        <div className="h-24 rounded-lg bg-muted/50 border"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-10 rounded bg-muted/30 w-full"></div>
                    <div className="h-10 rounded bg-muted/30 w-3/4"></div>
                    <div className="h-10 rounded bg-muted/30 w-5/6"></div>
                    <div className="h-40 rounded-lg bg-secondary/20 border border-secondary/20 p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Zap className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-semibold">AI Insight</span>
                        </div>
                        <div className="h-2 bg-muted/20 rounded w-full mb-2"></div>
                        <div className="h-2 bg-muted/20 rounded w-2/3"></div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- LOGO CLOUD --- */}
      <div className="py-10 border-y bg-muted/20">
        <div className="container mx-auto px-6 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-6 uppercase tracking-wider">Secured by industry leaders</p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-xl font-bold">Paystack</span>
                <span className="text-xl font-bold">Neon</span>
                <span className="text-xl font-bold">Vercel</span>
                <span className="text-xl font-bold">Render</span>
            </div>
        </div>
      </div>

      {/* --- BENTO GRID FEATURES --- */}
      <section id="features" className="py-24 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Financial superpowers included.</h2>
            <p className="text-muted-foreground text-lg">Everything you need to stop worrying about money and start building wealth.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Card 1: Large */}
            <div className="md:col-span-2 rounded-2xl border bg-card p-8 flex flex-col justify-between overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                    <PieChart className="w-64 h-64" />
                </div>
                <div>
                    <h3 className="text-2xl font-bold mb-2">Smart Split Rules</h3>
                    <p className="text-muted-foreground">Define percentage-based or fixed rules. When you get paid, we do the math and move the money. Instantly.</p>
                </div>
                <div className="flex gap-2 mt-4">
                    <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Rent: 30%</div>
                    <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">Savings: 20%</div>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-medium">Food: 15%</div>
                </div>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border bg-card p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                <Zap className="h-10 w-10 text-primary mb-4" />
                <div>
                    <h3 className="text-xl font-bold mb-2">AI Financial Co-pilot</h3>
                    <p className="text-muted-foreground text-sm">Our AI analyzes your spending to suggest better split ratios and detect subscription creep.</p>
                </div>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border bg-card p-8 flex flex-col justify-between">
                <Smartphone className="h-10 w-10 text-primary mb-4" />
                <div>
                    <h3 className="text-xl font-bold mb-2">Dedicated Bank Account</h3>
                    <p className="text-muted-foreground text-sm">Get your own unique account number. Any transfer to it triggers your split rules automatically.</p>
                </div>
            </div>

            {/* Card 4: Wide */}
            <div className="md:col-span-2 rounded-2xl border bg-card p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                 <div className="flex-1 relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Bank-Grade Security</h3>
                    <p className="text-muted-foreground mb-4">We use 256-bit encryption and audited double-entry ledgers. Your money is safe, traceable, and secure.</p>
                    <ul className="space-y-2">
                        <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> Double-Entry Ledger</li>
                        <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> Fraud Detection</li>
                        <li className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-4 w-4 text-green-500" /> ISO 27001 Compliant Infrastructure</li>
                    </ul>
                </div>
                <div className="relative">
                    <Shield className="h-40 w-40 text-muted/20" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-background border rounded-lg p-4 shadow-lg">
                            <div className="text-xs font-mono text-green-500">System Secure</div>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS --- */}
      <section id="how-it-works" className="py-24">
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold text-center mb-16">Three steps to financial freedom</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {[
                    { title: "1. Connect", desc: "Sign up and get your dedicated virtual bank account number." },
                    { title: "2. Configure", desc: "Set your split rules. Example: 30% Rent, 20% Savings, 50% Flex." },
                    { title: "3. Relax", desc: "Direct your salary to FlowSplit. We handle the rest automatically." }
                ].map((step, i) => (
                    <div key={i} className="flex flex-col items-center text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl mb-4">
                            {i + 1}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                        <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-24 border-t bg-muted/20">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-6">Ready to automate your wealth?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of users who have stopped manually budgeting and started living.
            </p>
            <Link href="/register">
                <Button size="lg" className="h-14 px-10 text-lg">Create Free Account</Button>
            </Link>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="border-t py-12 bg-background">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 font-bold text-lg">
                <div className="relative h-6 w-6 overflow-hidden rounded-[8px]">
                    <Image 
                      src="/images/logo.jpg" 
                      alt="FlowSplit" 
                      fill 
                      className="object-cover" 
                    />
                </div>
                <span>
                    <span className="text-foreground">Flow</span>
                    <span className="text-teal">Split</span>
                </span>
            </div>
            <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} FlowSplit Financial. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
                <a href="#" className="hover:text-primary">Privacy</a>
                <a href="#" className="hover:text-primary">Terms</a>
                <a href="#" className="hover:text-primary">Twitter</a>
            </div>
        </div>
      </footer>
    </div>
  );
}