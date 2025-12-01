'use client';

import React, { useEffect, useState } from 'react';
import { OverviewCards } from './_components/OverviewCards';
import { UserGrowthChart } from './_components/UserGrowthChart';
import { AdminDashboardMetrics } from '../../types/admin-api';
import { getDashboardMetrics } from '../../lib/adminService';
import { toast } from 'sonner';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        console.error('Failed to fetch admin metrics', error);
        toast.error('Could not load dashboard metrics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">System Overview</h1>
      
      {isLoading || !metrics ? (
        <div className="text-center p-8">Loading system metrics...</div>
      ) : (
        <OverviewCards metrics={metrics} />
      )}
      
      <div className="grid grid-cols-1 gap-6">
        <UserGrowthChart />
      </div>
    </div>
  );
}