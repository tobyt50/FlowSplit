'use client';

import React, { useEffect, useState } from 'react';
import { TierLimit, getSystemLimits } from '../../../lib/adminLimitService';
import { LimitTierCard } from './_components/LimitTierCard';
import { ShieldAlert } from 'lucide-react';

export default function LimitsPage() {
  const [limits, setLimits] = useState<TierLimit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLimits = async () => {
    try {
      const data = await getSystemLimits();
      setLimits(data);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  if (isLoading) return <div className="p-8 text-center">Loading configuration...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-red-100 rounded-lg text-red-600">
            <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
            <h1 className="text-2xl font-semibold tracking-tight">Risk Configuration</h1>
            <p className="text-muted-foreground">
                Manage global transaction limits for all user tiers. Changes take effect immediately.
                <br />
                <span className="text-xs text-red-500 font-medium">All changes are audited.</span>
            </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {limits.map((limit) => (
          <LimitTierCard key={limit.id} limit={limit} onRefresh={fetchLimits} />
        ))}
      </div>
    </div>
  );
}