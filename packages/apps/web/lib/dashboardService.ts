import api from './api'; // Our configured, authenticated axios instance
import { UpcomingBill } from '../app/dashboard/overview/_components/UpcomingBills';

export interface CashFlowDataPoint {
  month: string;
  inflow: number;
  outflow: number;
}

export interface SplitAllocation {
  walletId: string;
  walletName: string;
  amount: bigint;
}

export interface LastSplitBreakdown {
  depositTransactionId: string;
  depositAmount: bigint;
  depositDate: Date;
  allocations: SplitAllocation[];
}

/**
 * Fetches all calculated upcoming bills for the currently authenticated user.
 * @returns A promise that resolves to an array of upcoming bill objects.
 */
export const getUpcomingBills = async (): Promise<UpcomingBill[]> => {
  try {
    const response = await api.get<UpcomingBill[]>(
      'http://localhost:4000/api/dashboard/upcoming-bills' //actual service http://localhost:3106
    );
    // Important: Backend sends BigInts as strings. We need to convert them back.
    return response.data.map(bill => ({
        ...bill,
        estimatedAmount: BigInt(bill.estimatedAmount),
        walletBalance: BigInt(bill.walletBalance),
    }));
  } catch (error: any) {
    console.error('Failed to fetch upcoming bills:', error);
    throw new Error(error.response?.data?.message || 'Could not load your upcoming bills.');
  }
};

/**
 * Fetches the aggregated cash flow data for the last 6 months.
 * @returns A promise that resolves to an array of cash flow data points.
 */
export const getCashFlow = async (): Promise<CashFlowDataPoint[]> => {
  try {
    const response = await api.get<CashFlowDataPoint[]>(
      'http://localhost:4000/api/dashboard/cash-flow' // URL to the dashboard-service
    );
    return response.data; // No BigInt conversion needed as the service returns numbers
  } catch (error: any) {
    console.error('Failed to fetch cash flow data:', error);
    throw new Error(error.response?.data?.message || 'Could not load your cash flow data.');
  }
};

export const getLastSplitBreakdown = async (): Promise<LastSplitBreakdown | null> => {
  try {
    const response = await api.get<LastSplitBreakdown | null>(
      'http://localhost:4000/api/dashboard/last-split'
    );
    if (!response.data) {
        return null;
    }
    // Convert BigInt strings back to BigInt
    return {
        ...response.data,
        depositAmount: BigInt(response.data.depositAmount),
        allocations: response.data.allocations.map(a => ({...a, amount: BigInt(a.amount)}))
    };
  } catch (error: any) {
    console.error('Failed to fetch last split breakdown:', error);
    throw new Error(error.response?.data?.message || 'Could not load your last split data.');
  }
};