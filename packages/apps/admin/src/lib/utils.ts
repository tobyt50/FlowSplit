import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * A utility function to conditionally join class names together.
 * It intelligently merges Tailwind CSS classes, preventing style conflicts.
 * e.g., cn('p-2', 'p-4') will correctly result in 'p-4'.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * A robust, full-scale utility function to format a numeric value
 * (string or bigint from the backend) into a user-friendly currency string.
 *
 * It handles different locales and currencies, ensuring correct formatting
 * for international users in the future.
 *
 * @param amount - The amount in the smallest currency unit (e.g., kobo),
 *                 represented as a string or a BigInt.
 * @param currencyCode - The ISO 4217 currency code (e.g., 'NGN', 'USD'). Defaults to 'NGN'.
 * @returns A formatted currency string (e.g., "₦1,234.56").
 */
export function formatCurrency(
  amount: string | bigint,
  currencyCode: string = 'NGN'
): string {
  try {
    // 1. Convert the input to a BigInt for safe handling of large numbers.
    const numericAmount = BigInt(amount);
    
    // 2. Convert the smallest unit (kobo) to the major unit (Naira) for formatting.
    // We handle this with floating-point math *only* for the final display formatting,
    // which is a safe and standard practice.
    const majorUnitAmount = Number(numericAmount) / 100;

    // 3. Use the powerful, built-in Intl.NumberFormat API for localization-aware formatting.
    // 'en-NG' is specified for Nigerian Naira to ensure the correct currency symbol and formatting rules.
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(majorUnitAmount);
  } catch (error) {
    console.error("Failed to format currency:", { amount, currencyCode, error });
    // Return a safe, identifiable fallback on failure.
    return "N/A";
  }
}