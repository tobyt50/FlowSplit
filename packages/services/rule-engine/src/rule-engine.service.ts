import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, Prisma } from '@flowsplit/prisma';

interface DepositPayload {
  userId: string;
  transactionId: string;
}

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(private readonly prisma: PrismaService) {}

  async processSplit(payload: DepositPayload): Promise<void> {
    const { userId, transactionId } = payload;
    this.logger.log(`Starting split process for transaction: ${transactionId}`);

    await this.prisma.$transaction(async (
      tx: Prisma.TransactionClient
    ) => {

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

      const totalAmount = depositTransaction.amount;
      let remainingAmount = totalAmount;

      const allocations: { amount: bigint; destinationWalletId: string }[] = [];

      for (const rule of splitRules) {
        if (remainingAmount <= 0n) break;
        const percentageAsInteger = BigInt(Math.round(rule.value * 100));
        const allocationAmount = (totalAmount * percentageAsInteger) / 10000n; // Use 10000n because we multiplied percentage by 100

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

      for (const allocation of allocations) {
        await tx.wallet.update({
          where: { id: allocation.destinationWalletId },
          data: { balance: { increment: allocation.amount } },
        });
      }

      await tx.transaction.update({
        where: { id: transactionId },
        data: { splitApplied: true, description: `Split into ${allocations.length} wallets.` },
      });

      this.logger.log(`Successfully split transaction ${transactionId} into ${allocations.length} wallets.`);
    });
  }
}