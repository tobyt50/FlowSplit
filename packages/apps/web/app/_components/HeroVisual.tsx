'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowDown, Wallet, PiggyBank, Home, Zap, TrendingUp } from 'lucide-react';

// --- Sub-components for the simulation ---

const AnimatedCounter = ({ value }: { value: number }) => {
  return (
    <span className="tabular-nums tracking-tight">
      ₦{value.toLocaleString()}
    </span>
  );
};

const SplitCard = ({ label, percentage, amount, icon: Icon, colorClass, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50 shadow-sm relative overflow-hidden"
  >
    {/* Progress Bar Background */}
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${percentage}%` }}
      transition={{ delay: delay + 0.5, duration: 1, type: "spring" }}
      className={`absolute left-0 top-0 bottom-0 opacity-10 ${colorClass.replace('text-', 'bg-')}`}
    />
    
    <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-')}/10 ${colorClass}`}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-xs font-bold">{percentage}%</span>
      </div>
      <div className="text-sm font-bold">₦{amount.toLocaleString()}</div>
    </div>
  </motion.div>
);

const TransactionRow = ({ title, amount, type, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-3 border-b border-border/40 last:border-0"
  >
    <div className="flex items-center gap-3">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${type === 'in' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
        {type === 'in' ? <ArrowDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">Just now</p>
      </div>
    </div>
    <span className={`text-sm font-mono ${type === 'in' ? 'text-green-500' : 'text-foreground'}`}>
      {type === 'in' ? '+' : ''}₦{amount.toLocaleString()}
    </span>
  </motion.div>
);

export function HeroVisual() {
  const [step, setStep] = useState(0);

  // Simulation Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % 2); // Toggle between state 0 and 1
    }, 8000); // Reset every 8 seconds
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-xl bg-card/50 backdrop-blur-sm border shadow-2xl overflow-hidden relative">
      
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />

      {/* Header */}
      <div className="h-12 border-b bg-muted/30 flex items-center px-4 justify-between">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/20" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
          <div className="w-3 h-3 rounded-full bg-green-500/20" />
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-background/50 border text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          System Live
        </div>
      </div>

      <div className="p-6 grid md:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: Main Status */}
        <div className="md:col-span-3 space-y-6">
          
          {/* Total Balance Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-sm font-medium text-primary mb-1">Total Net Worth</p>
              <div className="text-4xl font-extrabold tracking-tight text-foreground">
                <AnimatePresence mode='wait'>
                  {step === 0 ? (
                    <motion.div
                      key="start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AnimatedCounter value={1250000} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="end"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <AnimatedCounter value={1750000} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2 mt-4 text-xs font-medium text-green-500">
                <TrendingUp className="h-3 w-3" />
                <span>+40% this month</span>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="rounded-xl border bg-background/50 backdrop-blur-sm overflow-hidden h-[200px]">
            <div className="px-4 py-3 border-b bg-muted/20 text-xs font-semibold text-muted-foreground uppercase">
              Live Activity
            </div>
            <div className="p-2">
              <AnimatePresence>
                {step === 1 && (
                  <motion.div
                    key="deposit"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TransactionRow title="Salary Deposit" amount={500000} type="in" delay={0.2} />
                  </motion.div>
                )}
              </AnimatePresence>
              <TransactionRow title="Netflix Subscription" amount={-4500} type="out" delay={0} />
              <TransactionRow title="Grocery Run" amount={-25000} type="out" delay={0} />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Split Logic */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Active Splits</span>
            {step === 1 && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full"
              >
                Processing...
              </motion.span>
            )}
          </div>

          <AnimatePresence mode='wait'>
            <div className="space-y-3">
              {/* RENT */}
              <SplitCard 
                label="Rent" 
                percentage={30} 
                amount={step === 1 ? 150000 : 0} 
                icon={Home} 
                colorClass="text-blue-500" 
                delay={0.4} 
              />
              {/* SAVINGS */}
              <SplitCard 
                label="Savings" 
                percentage={20} 
                amount={step === 1 ? 100000 : 0} 
                icon={PiggyBank} 
                colorClass="text-green-500" 
                delay={0.6} 
              />
              {/* FLEX */}
              <SplitCard 
                label="Daily Spend" 
                percentage={50} 
                amount={step === 1 ? 250000 : 0} 
                icon={Wallet} 
                colorClass="text-amber-500" 
                delay={0.8} 
              />
            </div>
          </AnimatePresence>

          {/* AI Insight Popup Simulation */}
          <AnimatePresence>
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.5, type: 'spring' }}
                className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-start gap-3"
              >
                <div className="bg-purple-500/20 p-1.5 rounded-md">
                  <Zap className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mb-0.5">Smart Move</p>
                  <p className="text-[10px] text-muted-foreground leading-snug">
                    Your savings goal is ahead of schedule. Consider moving ₦5k to investments.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}