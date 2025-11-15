import { Injectable } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

export const WALLET_CREATION_SOURCE_ID = 'sys_wallet_creation';

@Injectable()
export class LedgerService {
  /**
   * Creates a zero-amount, balanced ledger transaction to record the creation of a new wallet.
   */
  async createWalletCreationTransaction(
    tx: Prisma.TransactionClient,
    newWalletId: string,
    description: string
  ): Promise<void> {
    const ledgerTransaction = await tx.ledgerTransaction.create({
      data: {
        id: createId(),
        description,
      },
    });

    // Debit of 0 from the system source
    await tx.ledgerEntry.create({
      data: {
        id: createId(),
        amount: 0n,
        type: LedgerEntryType.DEBIT,
        walletId: WALLET_CREATION_SOURCE_ID,
        ledgerTransactionId: ledgerTransaction.id,
      },
    });

    // Credit of 0 to the new user wallet
    await tx.ledgerEntry.create({
      data: {
        id: createId(),
        amount: 0n,
        type: LedgerEntryType.CREDIT,
        walletId: newWalletId,
        ledgerTransactionId: ledgerTransaction.id,
      },
    });
  }
}