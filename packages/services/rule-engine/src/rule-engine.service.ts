import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, SplitType, WalletType } from '@flowsplit/prisma';
import { LedgerService, LedgerMovement } from './ledger/ledger.service';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class RuleEngineService {
  private readonly logger = new Logger(RuleEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async processSplit(payload: { userId: string; transactionId: string }): Promise<void> {
    const { userId, transactionId } = payload;
    this.logger.log(`Starting HARDENED split process for transaction: ${transactionId}`);

    await this.prisma.$transaction(async (tx) => {
      // 1. Fetch ALL active rules, strictly ordered by priority.
      const allRules = await tx.splitRule.findMany({
        where: { userId, isActive: true },
        orderBy: { priority: 'asc' },
      });

      if (allRules.length === 0) {
        this.logger.warn(`User ${userId} has no active split rules. Skipping.`);
        await tx.transaction.update({
          where: { id: transactionId },
          data: { splitApplied: true, description: 'No active rules to apply.' },
        });
        return;
      }

      const depositTransaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      if (!depositTransaction) {
        throw new Error(`Transaction ${transactionId} not found.`);
      }

      if (depositTransaction.splitApplied) {
        this.logger.warn(`Transaction ${transactionId} has already been split. Skipping.`);
        return;
      }

      const totalAmount = depositTransaction.amount;
      let remainingForPercentageSplit = totalAmount;
      const allocations: { amount: bigint; destinationWalletId: string }[] = [];

      // --- STAGE 1: Process FIXED amount rules first ---
      this.logger.log('Processing FIXED rules...');
      const fixedRules = allRules.filter(r => r.type === SplitType.FIXED);

      for (const rule of fixedRules) {
        if (remainingForPercentageSplit <= 0n) break; // Stop if no money is left

        // Convert the float value from DB to a BigInt (kobo)
        const fixedAmount = BigInt(Math.round(rule.value));

        // Only allocate what is available
        const amountToAllocate = remainingForPercentageSplit < fixedAmount ? remainingForPercentageSplit : fixedAmount;
        
        if (amountToAllocate > 0n && rule.destinationWalletId) {
          allocations.push({ amount: amountToAllocate, destinationWalletId: rule.destinationWalletId });
          remainingForPercentageSplit -= amountToAllocate;
          this.logger.log(`Allocated ${amountToAllocate} (FIXED) to rule "${rule.name}"`);
        }
      }

      // --- STAGE 2: Process PERCENTAGE rules on the remainder ---
      this.logger.log(`Processing PERCENTAGE rules on remaining ${remainingForPercentageSplit}...`);
      const percentageRules = allRules.filter(r => r.type === SplitType.PERCENTAGE);
      let remainderForDefault = remainingForPercentageSplit;

      for (const rule of percentageRules) {
        if (remainingForPercentageSplit <= 0n) break;
        
        const percentageAsInteger = BigInt(Math.round(rule.value * 100));
        // IMPORTANT: Percentage is now based on the amount REMAINING after fixed splits.
        const allocationAmount = (remainingForPercentageSplit * percentageAsInteger) / 10000n;

        if (allocationAmount > 0n && rule.destinationWalletId) {
          allocations.push({ amount: allocationAmount, destinationWalletId: rule.destinationWalletId });
          remainderForDefault -= allocationAmount;
          this.logger.log(`Allocated ${allocationAmount} (PERCENTAGE) to rule "${rule.name}"`);
        }
      }
      
      // --- STAGE 3: Handle the final remainder ---
      if (remainderForDefault > 0n) {
        const primaryWallet = await tx.wallet.findFirst({ where: { userId, type: 'PERSONAL' } });
        if (!primaryWallet) throw new Error(`User ${userId} has no primary wallet for remainder.`);

        allocations.push({ amount: remainderForDefault, destinationWalletId: primaryWallet.id });
        this.logger.log(`Allocated final remainder of ${remainderForDefault} to Primary Wallet.`);
      }

      let sourceWallet = await tx.wallet.findFirst({
        where: { userId, type: WalletType.SOURCE },
      });
      if (!sourceWallet) {
        // This logic should ideally be more robust, potentially handled in the transactions-service
        // but is placed here as a fallback.
        const newWalletId = createId();
        sourceWallet = await tx.wallet.create({
            data: {
                id: newWalletId,
                name: 'Unallocated Funds',
                type: WalletType.SOURCE,
                userId: userId,
            }
        });
        // We do not create a ledger entry here, as the ingress transaction already credited this wallet.
      }

      // Consolidate multiple allocations that might go to the same wallet
      // into a single movement for cleaner ledger entries.
      const consolidatedCreditMovements = this.consolidateAllocations(allocations);

      // The total amount debited must equal the original deposit amount.
      const debitMovement: LedgerMovement = {
        walletId: sourceWallet.id,
        amount: totalAmount,
      };

      // Call the LedgerService to create the single, balanced, atomic transaction.
      await this.ledgerService.createTransaction(
        tx,
        debitMovement,
        consolidatedCreditMovements,
        `Split for deposit ref: ${depositTransaction.reference}`
      );

      // After successfully creating the ledger entries (the source of truth),
      // update the cached balances on the wallet records for performance.
      for (const movement of consolidatedCreditMovements) {
        await tx.wallet.update({
          where: { id: movement.walletId },
          data: { balance: { increment: movement.amount } },
        });
      }

      // Mark the original external transaction as successfully split.
      await tx.transaction.update({
        where: { id: transactionId },
        data: {
          splitApplied: true,
          description: `Split into ${consolidatedCreditMovements.length} wallets via hardened engine.`,
        },
      });

      this.logger.log(`Successfully created ledger entries for transaction ${transactionId}`);
    });
  }
  
  /**
   * A private helper method to consolidate multiple allocations for the same wallet
   * into a single LedgerMovement. This prevents creating redundant ledger entries
   * and simplifies balance updates.
   * e.g., [{ walletA, 100 }, { walletA, 50 }] => [{ walletA, 150 }]
   */
  private consolidateAllocations(
    allocations: { amount: bigint; destinationWalletId: string }[]
  ): LedgerMovement[] {
    const map = new Map<string, bigint>();
    for (const alloc of allocations) {
      map.set(
        alloc.destinationWalletId,
        (map.get(alloc.destinationWalletId) || 0n) + alloc.amount
      );
    }
    return Array.from(map, ([walletId, amount]) => ({ walletId, amount }));
  }
}