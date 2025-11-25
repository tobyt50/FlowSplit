import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

export const WALLET_CREATION_SOURCE_ID = 'sys_wallet_creation';

export interface LedgerMovement {
  walletId: string;
  amount: bigint;
}

@Injectable()
export class LedgerService {

  private readonly logger = new Logger(LedgerService.name);

  /**
   * Creates a balanced double-entry ledger transaction.
   * Used for sweeping funds during wallet closure.
   */
  async createTransaction(
    tx: Prisma.TransactionClient,
    debit: LedgerMovement,
    credits: LedgerMovement[],
    description: string
  ): Promise<string> {
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0n);

    // Safety Check: Debits must equal Credits
    if (debit.amount !== totalCredits) {
      this.logger.error(`Ledger transaction unbalanced. Debit: ${debit.amount}, Credits: ${totalCredits}`);
      throw new InternalServerErrorException('Ledger transaction is unbalanced.');
    }

    // 1. Create the Transaction Record
    const ledgerTransaction = await tx.ledgerTransaction.create({
      data: {
        id: createId(),
        description,
      },
    });

    // 2. Create the DEBIT Entry
    await tx.ledgerEntry.create({
      data: {
        id: createId(),
        amount: debit.amount,
        type: LedgerEntryType.DEBIT,
        walletId: debit.walletId,
        ledgerTransactionId: ledgerTransaction.id,
      },
    });

    // 3. Create the CREDIT Entry/Entries
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

    this.logger.log(`Created ledger transaction ${ledgerTransaction.id}`);
    return ledgerTransaction.id;
  }
  
  /**
   * Creates a zero-amount, balanced ledger transaction to record the creation of a new wallet.
   */
  async createWalletCreationTransaction(
    tx: Prisma.TransactionClient,
    newWalletId: string,
    description: string
  ): Promise<void> {
    // We reuse the logic above, effectively moving 0 funds
    await this.createTransaction(
      tx,
      { walletId: WALLET_CREATION_SOURCE_ID, amount: 0n },
      [{ walletId: newWalletId, amount: 0n }],
      description
    );
  }
}