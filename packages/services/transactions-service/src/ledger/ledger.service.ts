import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';
import { WALLET_CREATION_SOURCE_ID } from '../system/system-wallets.service';

export interface LedgerMovement {
  walletId: string;
  amount: bigint;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  async createTransaction(
    tx: Prisma.TransactionClient,
    debit: LedgerMovement,
    credits: LedgerMovement[],
    description: string
  ): Promise<void> {
    const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0n);

    if (debit.amount !== totalCredits) {
      this.logger.error(`Ledger transaction unbalanced. Debit: ${debit.amount}, Credits: ${totalCredits}`);
      throw new InternalServerErrorException('Ledger transaction is unbalanced.');
    }

    const ledgerTransaction = await tx.ledgerTransaction.create({
      data: { id: createId(), description },
    });

    await tx.ledgerEntry.create({
      data: {
        id: createId(),
        amount: debit.amount,
        type: LedgerEntryType.DEBIT,
        walletId: debit.walletId,
        ledgerTransactionId: ledgerTransaction.id,
      },
    });

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
  }

  /**
   * Creates a zero-amount, balanced ledger transaction to record the creation of a new wallet.
   */
  async createWalletCreationTransaction(
    tx: Prisma.TransactionClient,
    newWalletId: string,
    description: string
  ): Promise<void> {
    await this.createTransaction(
      tx,
      { walletId: WALLET_CREATION_SOURCE_ID, amount: 0n },
      [{ walletId: newWalletId, amount: 0n }],
      description
    );
  }
}