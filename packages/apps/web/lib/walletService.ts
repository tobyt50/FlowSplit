import api from './api'; // Our configured, authenticated axios instance
import { Wallet } from '../types/index';
import { WalletType } from '../lib/enums';

/**
 * A utility function to format a BigInt string (representing kobo/cents)
 * into a user-friendly currency string (e.g., "₦1,234.56").
 *
 * @param amount - The amount in the smallest currency unit (as a string or bigint).
 * @param currencyCode - The ISO currency code (e.g., 'NGN').
 * @returns A formatted currency string.
 */
export const formatCurrency = (
  amount: string | bigint,
  currencyCode: string = 'NGN'
) => {
  const numericAmount = BigInt(amount);
  const majorUnitAmount = Number(numericAmount) / 100;
  return new Intl.NumberFormat('en-NG', { // Using 'en-NG' for Nigerian Naira formatting
    style: 'currency',
    currency: currencyCode,
  }).format(majorUnitAmount);
};

interface CreateWalletData {
  name: string;
  type: WalletType;
  currency?: string;
}

/**
 * Fetches all wallets for the currently authenticated user.
 * The JWT is automatically attached by the axios interceptor in `api.ts`.
 * @returns A promise that resolves to an array of the user's wallets.
 */
export const getWallets = async (): Promise<Wallet[]> => {
  try {
    const response = await api.get<Wallet[]>(
      'http://localhost:4000/api/wallets' //actual service http://localhost:3102
    );
    return response.data;
  } catch (error: any) {
    // Log the error and re-throw a more user-friendly message
    console.error('Failed to fetch wallets:', error);
    throw new Error(error.response?.data?.message || 'Could not load your wallets.');
  }
};
  /**
 * Creates a new wallet for the currently authenticated user.
 * @param data - The details for the new wallet.
 * @returns A promise that resolves to the newly created wallet.
 */
export const createWallet = async (data: CreateWalletData): Promise<Wallet> => {
  try {
    const response = await api.post<Wallet>(
      'http://localhost:4000/api/wallets', // URL to the wallet-service POST endpoint
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Failed to create wallet:', error);
    throw new Error(error.response?.data?.message || 'Could not create your wallet.');
  }
};

/**
 * Fetches a specific wallet by ID.
 */
export const getWalletById = async (id: string): Promise<Wallet> => {
  try {
    const response = await api.get<Wallet>(`http://localhost:4000/api/wallets/${id}`);
    return response.data;
  } catch (error: any) {
    console.error(`Failed to fetch wallet ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Could not load wallet details.');
  }
};

/**
 * Deletes a wallet and optionally transfers funds to a target wallet.
 */
export const deleteWallet = async (id: string, targetWalletId?: string): Promise<void> => {
  try {
    const url = targetWalletId 
      ? `http://localhost:4000/api/wallets/${id}?targetWalletId=${targetWalletId}`
      : `http://localhost:4000/api/wallets/${id}`;
      
    await api.delete(url);
  } catch (error: any) {
    console.error(`Failed to delete wallet ${id}:`, error);
    throw new Error(error.response?.data?.message || 'Could not delete wallet.');
  }
};