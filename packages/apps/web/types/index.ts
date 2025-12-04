// Define the shape of a Wallet as received from the API
export interface Wallet {
  id: string;
  name: string;
  type: 'PERSONAL' | 'SAVINGS' | 'BILL' | 'INVESTMENT' | 'SOURCE';
  balance: string; // Note: BigInts are serialized to strings over JSON
  currency: string;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
}

// Define the shape of a SplitRule as received from the API
export interface SplitRule {
  id: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  destinationWalletId: string | null;
  priority: number;
  isActive: boolean;
  isBill: boolean;
  dueDate: number | null;
  createdAt: string;
}

// Define the shape of a Transaction as received from the API
export interface Transaction {
  id: string;
  reference: string;
  type: 'CREDIT' | 'DEBIT' | 'TRANSFER';
  amount: string; // BigInt string
  currency: string;
  category: string | null;
  description: string | null;
  status: string;
  initiatedAt: string;
  completedAt: string | null;
  splitApplied: boolean;
}