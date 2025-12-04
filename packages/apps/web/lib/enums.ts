// Wallet Types
export const WalletTypes = {
  PERSONAL: 'PERSONAL',
  SAVINGS: 'SAVINGS',
  BILL: 'BILL',
  INVESTMENT: 'INVESTMENT',
  SOURCE: 'SOURCE',
} as const;
// The type keeps the singular name "WalletType"
export type WalletType = (typeof WalletTypes)[keyof typeof WalletTypes];

// Split Types
export const SplitTypes = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
} as const;
export type SplitType = (typeof SplitTypes)[keyof typeof SplitTypes];

// Currencies
export const Currencies = {
  NGN: 'NGN',
} as const;
export type Currency = (typeof Currencies)[keyof typeof Currencies];

// Transaction Types
export const TransactionTypes = {
  CREDIT: 'CREDIT',
  DEBIT: 'DEBIT',
  TRANSFER: 'TRANSFER',
} as const;
export type TransactionType = (typeof TransactionTypes)[keyof typeof TransactionTypes];