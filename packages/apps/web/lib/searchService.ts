import api from './api';
import { API_URLS } from './config';
import { UnifiedTransaction, VirtualCard, Wallet, SplitRule } from '../types/index';
import {  } from './cardService';

export interface SearchResults {
  wallets: Wallet[];
  rules: SplitRule[];
  transactions: UnifiedTransaction[];
  cards: VirtualCard[];
}

/**
 * Performs a global search via the backend API.
 */
export const globalSearch = async (query: string): Promise<SearchResults> => {
  try {
    const response = await api.get<SearchResults>(`${API_URLS.MONOLITH}/search`, {
      params: { q: query }
    });
    
    return response.data;
  } catch (error) {
    console.error('Search failed:', error);
    return { wallets: [], rules: [], transactions: [], cards: [] };
  }
};