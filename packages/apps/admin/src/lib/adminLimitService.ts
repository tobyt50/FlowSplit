import api from './api';
import { toast } from 'sonner';

// Matches the Prisma Model structure
export interface TierLimit {
  id: string;
  tier: 'TIER_0' | 'TIER_1' | 'TIER_2';
  currency: string;
  maxPerTransaction: string; // BigInt comes as string
  maxDaily: string;
  maxMonthly: string;
}

export interface UpdateLimitData {
  maxPerTransaction: number;
  maxDaily: number;
  maxMonthly: number;
}

const BASE_URL = process.env.NEXT_PUBLIC_ADMIN_SERVICE_URL || 'http://localhost:4000/api';

export const getSystemLimits = async (): Promise<TierLimit[]> => {
  try {
    const response = await api.get<TierLimit[]>(`${BASE_URL}/admin/limits`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch limits:', error);
    throw new Error('Could not load system limits.');
  }
};

export const updateSystemLimit = async (tier: string, data: UpdateLimitData): Promise<TierLimit> => {
  try {
    const response = await api.patch<TierLimit>(`${BASE_URL}/admin/limits/${tier}`, data);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to update ${tier} limits:`, error);
    throw new Error(error.response?.data?.message || 'Update failed.');
  }
};