import api from './api'; // Our authenticated axios instance
import { API_URLS } from './config';

// --- Types ---
export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface AddBankAccountData {
  accountNumber: string;
  bankCode: string; // NIP Bank Code (e.g. "058")
  bankName: string; // Name for display
  accountType: 'SAVINGS' | 'CURRENT';
}

export interface InitiatePayoutData {
  sourceWalletId: string;
  destinationBankId: string;
  amount: number; // In kobo
  reference: string; // Unique idempotency key
}

// --- API Calls ---

/**
 * Fetches all linked bank accounts for the authenticated user.
 */
export const getBankAccounts = async (): Promise<BankAccount[]> => {
  try {
    const response = await api.get<BankAccount[]>(`${API_URLS.MONOLITH}/bank-accounts`);
    return response.data;
  } catch (error: any) {
    console.error('Failed to fetch bank accounts:', error);
    throw new Error(error.response?.data?.message || 'Could not load bank accounts.');
  }
};

/**
 * Adds and verifies a new external bank account.
 */
export const addBankAccount = async (data: AddBankAccountData): Promise<BankAccount> => {
  try {
    const response = await api.post<BankAccount>(`${API_URLS.MONOLITH}/bank-accounts`, data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to add bank account:', error);
    throw new Error(error.response?.data?.message || 'Could not verify and link this account.');
  }
};

/**
 * Initiates a withdrawal from a wallet to a bank account.
 */
export const initiatePayout = async (data: InitiatePayoutData): Promise<{ payoutId: string, status: string }> => {
  try {
    const response = await api.post(`${API_URLS.MONOLITH}/payouts/initiate`, data);
    return response.data;
  } catch (error: any) {
    console.error('Failed to initiate payout:', error);
    throw new Error(error.response?.data?.message || 'Withdrawal failed.');
  }
};

/**
 * Sets a bank account as the primary default.
 */
export const setPrimaryBankAccount = async (accountId: string): Promise<void> => {
  try {
    await api.patch(`${API_URLS.MONOLITH}/bank-accounts/${accountId}/primary`);
  } catch (error: any) {
    console.error('Failed to set primary account:', error);
    throw new Error(error.response?.data?.message || 'Could not update account settings.');
  }
};

/**
 * Deletes a bank account.
 */
export const deleteBankAccount = async (accountId: string): Promise<void> => {
  try {
    await api.delete(`${API_URLS.MONOLITH}/bank-accounts/${accountId}`);
  } catch (error: any) {
    console.error('Failed to delete bank account:', error);
    throw new Error(error.response?.data?.message || 'Could not delete account.');
  }
};