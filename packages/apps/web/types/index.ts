// --- ENUMS (String Unions for Frontend) ---

export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type TransactionType = 'CREDIT' | 'DEBIT' | 'TRANSFER';
export type SplitType = 'PERCENTAGE' | 'FIXED';
export type Provider = 'PAYSTACK' | 'FLUTTERWAVE' | 'PLAID' | 'MANUAL';
export type WalletType = 'PERSONAL' | 'SAVINGS' | 'BILL' | 'INVESTMENT' | 'SOURCE' | 'LIABILITY';
export type LedgerEntryType = 'DEBIT' | 'CREDIT';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
export type AccountType = 'SAVINGS' | 'CURRENT';
export type Currency = 'NGN' | 'USD';

// --- MODELS ---

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  password?: string; // Usually excluded by API
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  provider: Provider | null;
  providerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  balance: string; // BigInt -> String
  currency: Currency;
  createdAt: string;
  updatedAt: string;
  userId?: string | null;
  targetAmount: string;
}

export interface UpdateWalletData {
  name?: string;
  targetAmount?: number; // kobo
}

export interface Account {
  id: string;
  bankName: string;
  accountNumber: string;
  balance: string; // BigInt -> String
  provider: Provider;
  isPrimary: boolean;
  linkedAt: string;
  userId: string;
}

export interface SplitRule {
  id: string;
  name: string;
  type: SplitType;
  value: number; // Float in DB, Number in JS
  destinationWalletId: string | null;
  priority: number;
  isActive: boolean;
  isBill: boolean;
  dueDate: number | null;
  createdAt: string;
  userId: string;
}

export interface Transaction {
  id: string;
  reference: string;
  type: TransactionType;
  amount: string; // BigInt -> String
  currency: Currency;
  category: string | null;
  description: string | null;
  status: string;
  initiatedAt: string;
  completedAt: string | null;
  splitApplied: boolean;
  userId: string;
  accountId: string | null;
  walletId: string | null;
  ledgerTransaction?: LedgerTransaction; 
}

export interface UnifiedTransaction {
  id: string;
  type: 'DEBIT' | 'CREDIT';
  amount: string; // BigInt serialized as string
  currency: string;
  date: string;   // ISO Date string
  status: string;
  title: string;
  subtitle: string;
  source: 'WALLET' | 'CARD';
  reference?: string;
}

export interface Analytics {
  id: string;
  totalInflow: string; // BigInt -> String
  totalOutflow: string; // BigInt -> String
  totalSavings: string; // BigInt -> String
  updatedAt: string;
  userId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR'
  read: boolean;
  actionUrl: string | null;
  createdAt: string;
  userId: string;
}

export interface WebhookEvent {
  id: string;
  eventType: string;
  payload: any; // JSON
  receivedAt: string;
  processed: boolean;
}

export interface VirtualAccount {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  currency: Currency;
  provider: Provider;
  providerRef: string | null;
  createdAt: string;
  updatedAt: string;
}

// --- LEDGER SYSTEM ---

export interface LedgerTransaction {
  id: string;
  description: string;
  createdAt: string;
  entries: LedgerEntry[]; // Often included
}

export interface LedgerEntry {
  id: string;
  amount: string; // BigInt -> String
  type: LedgerEntryType;
  createdAt: string;
  walletId: string;
  ledgerTransactionId: string;
  
  // Relations often included
  wallet?: Wallet;
}

// --- PAYOUT SYSTEM ---

export interface BankAccount {
  id: string;
  userId: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  isPrimary: boolean;
  isVerified: boolean;
  provider: Provider;
  providerRef: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payout {
  id: string;
  userId: string;
  sourceWalletId: string;
  destinationBankId: string;
  amount: string; // BigInt -> String
  currency: Currency;
  reference: string;
  providerReference: string | null;
  status: PayoutStatus;
  failureReason: string | null;
  initiatedAt: string;
  completedAt: string | null;
  ledgerTransactionId: string | null;
}

export interface InsightPayload {
  amount?: string;
  currentRate?: number;
  name?: string;
  walletName?: string;
  ruleId?: string;
  walletId?: string;
}

export interface AIInsight {
  insightCode: string;
  title: string;
  description: string;
  actionText: string | null;
  payload: InsightPayload;
}

export interface VirtualCard {
  id: string;
  nameOnCard: string;
  last4: string;
  brand: string; // 'Visa' | 'Mastercard'
  expiryMonth: number;
  expiryYear: number;
  status: 'ACTIVE' | 'INACTIVE' | 'FROZEN' | 'CANCELED';
  currency: string;
  walletId: string;
  wallet?: Wallet; // Optional relation
  createdAt: string;
}

export interface CreateCardData {
  walletId: string;
  nameOnCard: string;
}