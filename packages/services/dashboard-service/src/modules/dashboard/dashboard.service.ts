import { Injectable, Logger } from '@nestjs/common';
import { LedgerEntryType, PrismaService, SplitType, TransactionType, WalletType } from '@flowsplit/prisma';

export interface UpcomingBill {
  ruleId: string;
  name: string;
  estimatedAmount: bigint;
  dueDate: number;
  daysUntilDue: number;
  walletName: string;
  walletBalance: bigint;
}

export interface CashFlowDataPoint {
  month: string; // e.g., "Jan", "Feb", "Mar"
  inflow: number; // Stored as a number (major unit, e.g., Naira) for charting ease
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

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getUpcomingBills(userId: string): Promise<UpcomingBill[]> {
    const today = new Date();
    const currentDay = today.getDate();

    // --- STEP 1: CALCULATE AVERAGE MONTHLY INCOME (THE NON-SIMPLIFIED LOGIC) ---
    // Look at credit transactions over the last 90 days for a stable average.
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);

    const incomeTransactions = await this.prisma.transaction.findMany({
      where: {
        userId,
        type: TransactionType.CREDIT,
        initiatedAt: { gte: ninetyDaysAgo },
        // We can add more filters here, e.g., excluding transfers between wallets
        // or amounts below a certain threshold to filter out noise like refunds.
        amount: { gte: 10000n } // Example: Ignore credits less than ₦100
      },
      select: {
        amount: true,
      },
    });

    const totalIncomeLast90Days = incomeTransactions.reduce((sum, tx) => sum + tx.amount, 0n);
    // Calculate the average monthly income from the 90-day total.
    // We divide by 3. Default to a sensible non-zero value to avoid division by zero.
    const averageMonthlyIncome = totalIncomeLast90Days > 0n ? totalIncomeLast90Days / 3n : 30000000n; // Default to ₦300k if no history
    this.logger.log(`Calculated average monthly income for user ${userId}: ${averageMonthlyIncome}`);


    // --- STEP 2: FETCH BILL RULES AND BUILD THE PROJECTION (Unchanged from before) ---
    const billRules = await this.prisma.splitRule.findMany({
      where: {
        userId,
        isActive: true,
        isBill: true,
        dueDate: { gte: currentDay },
      },
      orderBy: { dueDate: 'asc' },
      include: { destinationWallet: true },
    });

    const upcomingBills: UpcomingBill[] = billRules
      .filter(rule => rule.dueDate && rule.destinationWallet)
      .map(rule => {
        let estimatedAmount = 0n;
        if (rule.type === SplitType.FIXED) {
          estimatedAmount = BigInt(Math.round(rule.value));
        } else { // PERCENTAGE
          const percentage = BigInt(Math.round(rule.value * 100));
          // Use the *real* calculated average income for the projection
          estimatedAmount = (averageMonthlyIncome * percentage) / 10000n;
        }

        const daysUntilDue = rule.dueDate! - currentDay;

        return {
          ruleId: rule.id,
          name: rule.name,
          estimatedAmount,
          dueDate: rule.dueDate!,
          daysUntilDue: daysUntilDue < 0 ? 0 : daysUntilDue,
          walletName: rule.destinationWallet!.name,
          walletBalance: rule.destinationWallet!.balance,
        };
    });

    return upcomingBills;
  }

  /**
   * Calculates the user's total cash flow (inflow vs. outflow) for the last 6 months.
   * This is a full-scale implementation that uses the ledger as the source of truth.
   */
  async getCashFlow(userId: string): Promise<CashFlowDataPoint[]> {
    this.logger.log(`Calculating cash flow for user ${userId}`);

    // Define the start date for our query (6 months ago)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // Start from the beginning of that month
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // 1. Fetch all relevant ledger entries in a single query for efficiency
    const ledgerEntries = await this.prisma.ledgerEntry.findMany({
      where: {
        wallet: {
          // IMPORTANT: Only include entries related to the specified user's wallets
          userId: userId,
        },
        createdAt: {
          gte: sixMonthsAgo,
        },
        // We exclude entries between two user-owned wallets (internal transfers)
        // as they are not true inflows or outflows from the user's ecosystem.
        // We identify true in/out by looking at transactions involving system wallets.
        ledgerTransaction: {
          entries: {
            some: {
              wallet: {
                userId: null, // The other side of the transaction involves a system wallet
              },
            },
          },
        },
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
      },
    });

    // 2. Aggregate the results by month in application code
    const monthlyAggregates = new Map<string, { inflow: bigint; outflow: bigint }>();
    const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

    for (const entry of ledgerEntries) {
      const month = monthFormatter.format(entry.createdAt);
      if (!monthlyAggregates.has(month)) {
        monthlyAggregates.set(month, { inflow: 0n, outflow: 0n });
      }
      const monthData = monthlyAggregates.get(month)!;

      if (entry.type === LedgerEntryType.CREDIT) {
        monthData.inflow += entry.amount;
      } else { // DEBIT
        monthData.outflow += entry.amount;
      }
    }

    // 3. Generate the final, ordered list of data points for the last 6 months
    const result: CashFlowDataPoint[] = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = monthFormatter.format(date);

      const data = monthlyAggregates.get(month) || { inflow: 0n, outflow: 0n };

      result.push({
        month,
        // Convert from kobo (BigInt) to Naira (number) for the charting library
        inflow: Number(data.inflow) / 100,
        outflow: Number(data.outflow) / 100,
      });
    }

    return result;
  }

  /**
   * Finds the last external deposit for a user and returns a detailed breakdown
   * of how it was split, based on the ledger.
   */
  async getLastSplitBreakdown(userId: string): Promise<LastSplitBreakdown | null> {
    this.logger.log(`Fetching last split breakdown for user ${userId}`);

    // 1. Find the most recent external transaction record that was successfully split
    //    AND has a ledger transaction linked to it.
    const lastDeposit = await this.prisma.transaction.findFirst({
      where: {
        userId,
        type: TransactionType.CREDIT,
        splitApplied: true,
        ledgerTransactionId: {
          not: null, // Ensure the link exists
        },
      },
      orderBy: {
        completedAt: 'desc', // Use completedAt for more accuracy
      },
    });

    if (!lastDeposit || !lastDeposit.ledgerTransactionId) {
      this.logger.log(`No split deposits with a linked ledger found for user ${userId}`);
      return null;
    }

    // 2. --- THE CRITICAL FIX ---
    // Directly fetch the LedgerTransaction using the foreign key.
    // This is guaranteed to be the correct one.
    const splitLedgerTx = await this.prisma.ledgerTransaction.findUnique({
      where: {
        id: lastDeposit.ledgerTransactionId,
      },
      include: {
        entries: {
          where: {
            type: LedgerEntryType.CREDIT, // We only need the credit allocations
          },
          include: {
            wallet: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!splitLedgerTx) {
      this.logger.warn(`Data inconsistency: Linked ledger transaction ${lastDeposit.ledgerTransactionId} not found for deposit ${lastDeposit.id}`);
      return null;
    }

    // 3. Format the data for the frontend (this is now simpler)
    const allocations: SplitAllocation[] = splitLedgerTx.entries.map(entry => ({
      walletId: entry.walletId,
      walletName: entry.wallet.name,
      amount: entry.amount,
    }));

    return {
      depositTransactionId: lastDeposit.id,
      depositAmount: lastDeposit.amount,
      depositDate: lastDeposit.completedAt || lastDeposit.initiatedAt,
      allocations,
    };
  }
}