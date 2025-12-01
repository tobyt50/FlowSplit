/**
 * A centralized, safe function for formatting BigInt kobo amounts into a currency string.
 * @param amount - The amount in the smallest currency unit (kobo).
 * @param currencyCode - The ISO currency code.
 * @returns A formatted currency string (e.g., "₦50,000.00").
 */
export const formatCurrency = (amount: bigint, currencyCode: string = 'NGN'): string => {
    try {
        const majorUnitAmount = Number(amount) / 100;
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: currencyCode,
        }).format(majorUnitAmount);
    } catch (error) {
        console.error("Currency formatting failed:", error);
        return "N/A";
    }
}