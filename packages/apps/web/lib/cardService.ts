import api from './api';
import { CreateCardData, VirtualCard } from '../types';
import { API_URLS } from './config';

/**
 * Fetches all virtual cards for the current user.
 */
export const getCards = async (): Promise<VirtualCard[]> => {
  try {
    const response = await api.get<VirtualCard[]>(`${API_URLS.MONOLITH}/cards`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch cards:', error);
    throw new Error(error.response?.data?.message || 'Could not load cards.');
  }
};

/**
 * Issues a new virtual card.
 */
export const issueCard = async (data: CreateCardData): Promise<VirtualCard> => {
  try {
    const response = await api.post<VirtualCard>(`${API_URLS.MONOLITH}/cards`, data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to issue card:', error);
    throw new Error(error.response?.data?.message || 'Card issuance failed.');
  }
};

/**
 * Freezes or Unfreezes a card.
 */
export const updateCardStatus = async (cardId: string, status: 'ACTIVE' | 'FROZEN'): Promise<void> => {
  try {
    await api.patch(`${API_URLS.MONOLITH}/cards/${cardId}/status`, { status });
  } catch (error: any) {
    console.error('Failed to update card status:', error);
    throw new Error(error.response?.data?.message || 'Action failed.');
  }
};