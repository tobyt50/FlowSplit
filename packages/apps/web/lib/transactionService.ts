import api from './api';
import { LedgerEntry, Transaction } from '@flowsplit/prisma';

export type TransactionWithLedger = Transaction & {
  ledgerTransaction?: {
    entries: ({
      wallet: { name: string };
    } & LedgerEntry)[];
  };
};

/**
 * Fetches all transactions for the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor.
 * @returns A promise that resolves to an array of the user's transactions, sorted by date.
 */
export const getTransactions = async (walletId?: string): Promise<Transaction[]> => {
  try {
    const url = walletId 
      ? `http://localhost:3103/api/transactions?walletId=${walletId}` //actual service http://localhost:3103
      : 'http://localhost:3103/api/transactions';
      
    const response = await api.get<Transaction[]>(url);
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
            `http://localhost:3103/api/transactions/${id}`
        );
        return response.data;
    } catch (error: any) {
        console.error(`Failed to fetch transaction ${id}:`, error);
        throw new Error(error.response?.data?.message || 'Could not load transaction details.');
    }
};