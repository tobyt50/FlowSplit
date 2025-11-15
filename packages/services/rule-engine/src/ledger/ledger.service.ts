import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

// Define the shape of a single movement of funds for clarity
export interface LedgerMovement {
  walletId: string;
  amount: bigint; // in kobo
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  /**
   * Creates a complete, balanced double-entry ledger transaction.
   * This is the single, authoritative method for moving funds between wallets.
   *
   * @param tx - The Prisma transaction client.
   * @param debit - The movement of funds OUT of a wallet.
   * @param credits - One or more movements of funds INTO other wallets.
   * @param description - A human-readable description of the transaction.
   */
  async createTransaction(
    tx: Prisma.TransactionClient,
    debit: LedgerMovement,
    credits: LedgerMovement[],
    description: string
  ): Promise<void> {
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0n);

    // --- SAFETY CHECK: Ensure the transaction is balanced ---
    if (debit.amount !== totalCredits) {
      this.logger.error(`Ledger transaction is unbalanced. Debit: ${debit.amount}, Credits: ${totalCredits}`);
      throw new InternalServerErrorException('Ledger transaction is unbalanced.');
    }

    // 1. Create the parent LedgerTransaction record
    const ledgerTransaction = await tx.ledgerTransaction.create({
      data: {
        id: createId(),
        description,
      },
    });

    // 2. Create the DEBIT entry
    await tx.ledgerEntry.create({
      data: {
        id: createId(),
        amount: debit.amount,
        type: LedgerEntryType.DEBIT,
        walletId: debit.walletId,
        ledgerTransactionId: ledgerTransaction.id,
      },
    });

    // 3. Create all the CREDIT entries
    for (const credit of credits) {
      await tx.ledgerEntry.create({
        data: {
          id: createId(),
          amount: credit.amount,
          type: LedgerEntryType.CREDIT,
          walletId: credit.walletId,
          ledgerTransactionId: ledgerTransaction.id,
        },
      });
    }

    this.logger.log(`Successfully created ledger transaction ${ledgerTransaction.id}`);
  }
}