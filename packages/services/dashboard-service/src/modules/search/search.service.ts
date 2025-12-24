import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Currency, Prisma } from '@flowsplit/prisma';
import { UnifiedTransaction } from '../../../../transactions-service/src/modules/transactions.service';

export interface GlobalSearchResults {
  wallets: any[];
  rules: any[];
  transactions: UnifiedTransaction[];
  cards: any[];
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async searchGlobal(userId: string, query: string): Promise<GlobalSearchResults> {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
        return { wallets: [], rules: [], transactions: [], cards: [] };
    }

    this.logger.log(`Executing global search for user ${userId}: "${sanitizedQuery}"`);

    // We check if the query string is a valid Currency enum (e.g. "NGN")
    const upperQuery = sanitizedQuery.toUpperCase();
    const isCurrencyMatch = Object.values(Currency).includes(upperQuery as Currency);

    // Build the OR condition dynamically for Wallets
    const walletOrConditions: Prisma.WalletWhereInput[] = [
        { name: { contains: sanitizedQuery, mode: 'insensitive' } }
    ];

    // Only add currency search if it's a valid enum value
    if (isCurrencyMatch) {
        walletOrConditions.push({ currency: { equals: upperQuery as Currency } });
    }
    // ----------------------------------------

    const [wallets, rules, transactions, cards] = await Promise.all([
      // 1. Wallets (Name OR Exact Currency)
      this.prisma.wallet.findMany({
        where: {
          userId,
          OR: walletOrConditions,
        },
        take: 5,
      }),

      // 2. Rules (Name)
      this.prisma.splitRule.findMany({
        where: {
          userId,
          name: { contains: sanitizedQuery, mode: 'insensitive' },
        },
        take: 5,
      }),

      // 3. Transactions (Description or Reference)
      this.prisma.transaction.findMany({
        where: {
          userId,
          OR: [
            { description: { contains: sanitizedQuery, mode: 'insensitive' } },
            { reference: { contains: sanitizedQuery, mode: 'insensitive' } },
          ],
        },
        orderBy: { initiatedAt: 'desc' },
        take: 10,
      }),

      // 4. Virtual Cards (Name, Last4, Brand)
      this.prisma.virtualCard.findMany({
        where: {
          userId,
          OR: [
            { nameOnCard: { contains: sanitizedQuery, mode: 'insensitive' } },
            { last4: { contains: sanitizedQuery } },
            { brand: { contains: sanitizedQuery, mode: 'insensitive' } },
          ],
        },
        include: { wallet: true },
        take: 5,
      }),
    ]);

    // Format Transactions to Unified Shape
    const formattedTransactions = transactions.map(tx => ({
      id: tx.id,
      type: tx.type === 'CREDIT' ? 'CREDIT' as const : 'DEBIT' as const,
      amount: tx.amount,
      currency: tx.currency,
      date: tx.initiatedAt,
      status: tx.status,
      title: tx.description || 'Transaction',
      subtitle: tx.type === 'CREDIT' ? 'Deposit' : 'Withdrawal',
      source: 'WALLET' as const,
      reference: tx.reference,
    }));

    return {
      wallets,
      rules,
      transactions: formattedTransactions,
      cards,
    };
  }
}