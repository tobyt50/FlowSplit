import api from './api'; // Our configured, authenticated axios instance
import { Transaction } from '@flowsplit/prisma';

/**
 * Fetches all transactions for the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor.
 * @returns A promise that resolves to an array of the user's transactions, sorted by date.
 */
export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await api.get<Transaction[]>(
      'http://localhost:3103/api/transactions' // URL to the transactions-service
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch transactions:', error);
    throw new Error(error.response?.data?.message || 'Could not load your transaction history.');
  }
};