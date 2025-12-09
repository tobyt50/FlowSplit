import api from './api';
import { API_URLS } from './config';
import { 
  Transaction, 
  UnifiedTransaction, 
  LedgerEntry
} from '../types/index';

// Helper type for the deep detail view
export type TransactionWithLedger = Transaction & { 
  ledgerTransaction?: {
    entries: (LedgerEntry & {
      wallet: { name: string };
    })[];
  };
};

/**
 * Fetches all transactions for the currently authenticated user.
 * Now returns UnifiedTransaction objects for the Activity Feed.
 * @returns A promise that resolves to an array of unified transactions.
 */
export const getTransactions = async (walletId?: string): Promise<UnifiedTransaction[]> => {
  try {
    const url = walletId 
      ? `${API_URLS.MONOLITH}/transactions?walletId=${walletId}`
      : `${API_URLS.MONOLITH}/transactions`;
      
    const response = await api.get<UnifiedTransaction[]>(url);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch transactions:', error);
    throw new Error(error.response?.data?.message || 'Could not load your transaction history.');
  }
};

/**
 * Fetches a single transaction by its ID, including its full ledger breakdown.
 * @param id - The ID of the transaction to fetch.
 * @returns A promise that resolves to a single detailed transaction object.
 */
export const getTransactionById = async (id: string): Promise<TransactionWithLedger> => {
    try {
        const response = await api.get<TransactionWithLedger>(
            `${API_URLS.MONOLITH}/transactions/${id}`
        );
        return response.data;
    } catch (error: any) {
        console.error(`Failed to fetch transaction ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Could not load transaction details.');
    }
};