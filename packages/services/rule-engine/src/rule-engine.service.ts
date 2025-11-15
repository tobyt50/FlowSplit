import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Prisma, WalletType } from '@flowsplit/prisma';
import { LedgerService, LedgerMovement } from './ledger/ledger.service';
import { createId } from '@paralleldrive/cuid2';

interface DepositPayload {
  userId: string;
  transactionId: string;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  // 2. Inject both PrismaService and LedgerService
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async processSplit(payload: DepositPayload): Promise<void> {
    const { userId, transactionId } = payload;
    this.logger.log(`Starting LEDGER split process for transaction: ${transactionId}`);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // --- This section remains unchanged ---
      const splitRules = await tx.splitRule.findMany({
        where: { userId, isActive: true },
        orderBy: { priority: 'asc' },
      });

      if (splitRules.length === 0) {
        this.logger.warn(`User ${userId} has no active split rules. Skipping.`);
        await tx.transaction.update({
          where: { id: transactionId },
          data: { splitApplied: true, description: 'No active rules to apply.' },
        });
        return;
      }

      const depositTransaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!depositTransaction) throw new Error(`Transaction ${transactionId} not found.`);
      if (depositTransaction.splitApplied) {
        this.logger.warn(`Transaction ${transactionId} has already been split. Skipping.`);
        return;
      }

      // --- This section also remains unchanged, including your BigInt math ---
      const totalAmount = depositTransaction.amount;
      let remainingAmount = totalAmount;
      const allocations: { amount: bigint; destinationWalletId: string }[] = [];

      for (const rule of splitRules) {
        if (remainingAmount <= 0n) break;
        const percentageAsInteger = BigInt(Math.round(rule.value * 100));
        const allocationAmount = (totalAmount * percentageAsInteger) / 10000n;

        if (allocationAmount > 0n && rule.destinationWalletId) {
          allocations.push({ amount: allocationAmount, destinationWalletId: rule.destinationWalletId });
          remainingAmount -= allocationAmount;
        }
      }

      if (remainingAmount > 0n) {
        const primaryWallet = await tx.wallet.findFirst({ where: { userId, type: 'PERSONAL' } });
        if (!primaryWallet) throw new Error(`User ${userId} has no primary wallet for remainder allocation.`);
        
        const existingAllocation = allocations.find(a => a.destinationWalletId === primaryWallet.id);
        if (existingAllocation) {
          existingAllocation.amount += remainingAmount;
        } else {
          allocations.push({ amount: remainingAmount, destinationWalletId: primaryWallet.id });
        }
      }

      // --- THIS IS THE REFACTORED SECTION ---

      // 3. Find-or-Create the user's virtual SOURCE wallet
      let sourceWallet = await tx.wallet.findFirst({
        where: { userId, type: WalletType.SOURCE },
      });
      if (!sourceWallet) {
        sourceWallet = await tx.wallet.create({
          data: {
            id: createId(), // Assuming createId is available
            name: 'Unallocated Funds',
            type: WalletType.SOURCE,
            userId: userId,
          },
        });
      }
      
      // 4. Prepare the debit and credit movements for the ledger
      const debitMovement: LedgerMovement = {
        walletId: sourceWallet.id,
        amount: totalAmount,
      };

      const creditMovements: LedgerMovement[] = allocations.map(alloc => ({
        walletId: alloc.destinationWalletId,
        amount: alloc.amount,
      }));

      // 5. Call the LedgerService to create the balanced, atomic transaction
      await this.ledgerService.createTransaction(
        tx,
        debitMovement,
        creditMovements,
        `Split for deposit ref: ${depositTransaction.reference}`
      );

      // 6. Update the cached balances on the wallet records. This replaces your old loop.
      for (const allocation of allocations) {
        await tx.wallet.update({
          where: { id: allocation.destinationWalletId },
          data: { balance: { increment: allocation.amount } },
        });
      }

      // 7. Mark the original transaction as applied
      await tx.transaction.update({
        where: { id: transactionId },
        data: { splitApplied: true, description: `Split into ${allocations.length} wallets via ledger.` },
      });

      this.logger.log(`Successfully created ledger entries for transaction ${transactionId}`);
    });
  }
}