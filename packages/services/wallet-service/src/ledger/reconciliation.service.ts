import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, LedgerEntryType } from '@flowsplit/prisma';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculates the true balance of a single wallet by summing its ledger entries.
   * @param walletId The ID of the wallet to calculate the balance for.
   * @returns The calculated balance as a BigInt.
   */
  async calculateTrueBalance(walletId: string): Promise<bigint> {
    const { _sum: credits } = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { walletId, type: LedgerEntryType.CREDIT },
    });

    const { _sum: debits } = await this.prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { walletId, type: LedgerEntryType.DEBIT },
    });

    const trueBalance = (credits.amount || 0n) - (debits.amount || 0n);
    return trueBalance;
  }

  /**
   * Compares the cached balance of a wallet with its calculated true balance.
   * @param walletId The ID of the wallet to check.
   * @returns An object indicating if the balance is reconciled and the difference if not.
   */
  async checkWalletBalance(walletId: string): Promise<{ reconciled: boolean; difference: bigint }> {
    const wallet = await this.prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      throw new Error(`Wallet with ID ${walletId} not found.`);
    }

    const cachedBalance = wallet.balance;
    const trueBalance = await this.calculateTrueBalance(walletId);

    const difference = trueBalance - cachedBalance;
    const reconciled = difference === 0n;

    if (!reconciled) {
        this.logger.warn(`Balance mismatch for wallet ${walletId}. Cached: ${cachedBalance}, True: ${trueBalance}, Difference: ${difference}`);
    }

    return { reconciled, difference };
  }
}