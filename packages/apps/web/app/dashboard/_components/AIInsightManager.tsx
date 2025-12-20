'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AIInsight } from '../../../types/index';
import { getAIInsight } from '../../../lib/aiService';
import { InsightToast } from '../../../components/ai/InsightToast';
import { AnimatePresence, motion } from 'framer-motion';

export function AIInsightManager() {
  const router = useRouter();
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchInsight = async () => {
      await new Promise(resolve => setTimeout(resolve, 3000));

      try {
        const data = await getAIInsight();

        if (!data || data.insightCode === 'DEFAULT_GREETING') {
          return;
        }

        setInsight(data);
        setIsVisible(true);
      } catch (error) {
        console.error("AI Insight Error:", error);
      }
    };

    fetchInsight();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleAction = () => {
    if (!insight) return;

    switch (insight.insightCode) {
      case 'UNALLOCATED_FUNDS':
        document.dispatchEvent(new CustomEvent('open-transfer-modal-unallocated', { detail: insight.payload }));
        break;
      case 'NEW_SUBSCRIPTION_DETECTED':
        router.push(`/dashboard/rules?action=create_bill&name=${encodeURIComponent(insight.payload.name || '')}&amount=${insight.payload.amount}`);
        break;
      case 'LOW_SAVINGS_RATE':
        router.push(`/dashboard/rules?action=edit_savings&ruleId=${insight.payload.ruleId}`);
        break;
      case 'HIGH_SPENDING_VELOCITY':
        if (insight.payload.walletId) {
          router.push(`/dashboard/wallets/${insight.payload.walletId}`);
        }
        break;
      default:
        router.push('/dashboard/overview');
    }
  };

  return (
    // Positioning Logic:
    // - Mobile: bottom-24 right-4 (Clears the bottom nav dock)
    // - Desktop: md:bottom-0 md:right-0 (Literally touches the edges)
    <div className="fixed bottom-24 right-4 md:bottom-4 md:right-3 z-[100] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isVisible && insight && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.5, type: "spring", bounce: 0 }}
            className="pointer-events-auto w-full max-w-[360px]" 
          >
            <InsightToast 
              insight={insight} 
              onAction={handleAction} 
              onClose={handleClose} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}