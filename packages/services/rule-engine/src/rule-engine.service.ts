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
      // 1. Fetch the Deposit Transaction first
      const depositTransaction = await tx.transaction.findUnique({ where: { id: transactionId } });
      
      if (!depositTransaction) {
        throw new Error(`Transaction ${transactionId} not found.`);
      }

      if (depositTransaction.splitApplied) {
        this.logger.warn(`Transaction ${transactionId} has already been split. Skipping.`);
        return;
      }

      // 2. Fetch User Settings to check for Override
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error(`User ${userId} not found`);

      // 3. Find-or-Create Source Wallet ("Unallocated Funds")
      let sourceWallet = await tx.wallet.findFirst({
        where: { userId, type: WalletType.SOURCE },
      });
      
      if (!sourceWallet) {
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

      const totalAmount = depositTransaction.amount;
      const allocations: { amount: bigint; destinationWalletId: string }[] = [];
      let logMessage = '';

      // --- LOGIC FORK ---
      
      if (user.depositOverrideWalletId) {
        // === PATH A: OVERRIDE ENABLED (PAUSE AUTOMATION) ===
        this.logger.warn(`User ${userId} has Deposit Override enabled. Routing 100% to wallet ${user.depositOverrideWalletId}`);
        
        // Validate the target wallet still exists and belongs to user
        const targetWallet = await tx.wallet.findUnique({ where: { id: user.depositOverrideWalletId } });
        
        if (targetWallet && targetWallet.userId === userId) {
           allocations.push({
             amount: totalAmount,
             destinationWalletId: targetWallet.id
           });
           logMessage = `100% Override to ${targetWallet.name}`;
        } else {
           // Fallback if target wallet was deleted or invalid: Route to Primary Personal
           this.logger.error(`Override wallet ${user.depositOverrideWalletId} invalid or not found. Falling back to Primary.`);
           const primary = await tx.wallet.findFirst({ where: { userId, type: 'PERSONAL' } });
           
           if(primary) {
             allocations.push({ amount: totalAmount, destinationWalletId: primary.id });
             logMessage = `Override failed. Fallback to Primary.`;
           } else {
             throw new Error(`User ${userId} has override enabled but target is invalid AND no primary wallet found.`);
           }
        }

      } else {
        // === PATH B: STANDARD RULE ENGINE ===
        
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

        let remainingForPercentageSplit = totalAmount;

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
        
        logMessage = `Split into ${allocations.length} wallets via hardened engine.`;
      }

      // --- EXECUTION PHASE (Shared by both paths) ---

      // Consolidate multiple allocations that might go to the same wallet
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
        `Split for deposit ref: ${depositTransaction.reference}. ${logMessage}`
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
          description: logMessage,
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