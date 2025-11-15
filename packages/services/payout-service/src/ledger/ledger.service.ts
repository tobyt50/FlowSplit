import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Prisma, LedgerEntryType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

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
  ): Promise<string> { // Return the ID of the created ledger transaction
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

    this.logger.log(`Created ledger transaction ${ledgerTransaction.id}`);
    return ledgerTransaction.id;
  }
}