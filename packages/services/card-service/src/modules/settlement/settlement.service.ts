import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, CardTransactionStatus } from '@flowsplit/prisma';
import { LedgerService } from '../../ledger/ledger.service';
import { FUNDS_ON_HOLD_WALLET_ID, STRIPE_EGRESS_WALLET_ID } from '../../system/system-wallets.service';

@Injectable()
export class SettlementService {
  private readonly logger = new Logger(SettlementService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Settles a card transaction based on the Stripe 'issuing_transaction.created' event.
   * This moves funds from the "Hold" (Liability) wallet to the "Egress" wallet.
   * It handles differences between the Authorized amount and the Settled amount.
   */
  async settleTransaction(stripeTx: any) {
    const { id: stripeTxId, authorization: authId, amount: settledAmount } = stripeTx;
    
    // Stripe amounts are integers in smallest currency unit.
    // We use absolute value because Stripe sends negative numbers for debits.
    const finalAmount = BigInt(Math.abs(settledAmount));

    this.logger.log(`Settling transaction ${stripeTxId} for Auth ${authId}. Amount: ${finalAmount}`);

    await this.prisma.$transaction(async (tx) => {
      // 1. Find the original pending transaction record
      const pendingTx = await tx.cardTransaction.findUnique({
        where: { providerAuthId: authId },
        include: { card: true },
      });

      if (!pendingTx) {
        this.logger.error(`Pending transaction for Auth ${authId} not found. Manual reconciliation required.`);
        return;
      }

      if (pendingTx.status === CardTransactionStatus.CLEARED) {
        this.logger.warn(`Transaction ${stripeTxId} already cleared. Idempotency check passed.`);
        return;
      }

      const authorizedAmount = pendingTx.amount;
      const userWalletId = pendingTx.card.walletId;

      // 2. Settlement Accounting Logic
      // We must ensure the Ledger accurately reflects who paid what.
      
      if (finalAmount === authorizedAmount) {
        // --- CASE 1: EXACT MATCH ---
        // Simple: Move the funds sitting in "Hold" to "Egress".
        await this.ledgerService.createTransaction(
          tx,
          { walletId: FUNDS_ON_HOLD_WALLET_ID, amount: authorizedAmount },
          [{ walletId: STRIPE_EGRESS_WALLET_ID, amount: authorizedAmount }],
          `Card Settlement: ${pendingTx.merchantName}`
        );

      } else if (finalAmount > authorizedAmount) {
        // --- CASE 2: OVERAGE (e.g. Tip, Currency Fluctuation) ---
        // The user owes MORE than we held.
        const diff = finalAmount - authorizedAmount;

        // A. Move the original held amount: Hold -> Egress
        await this.ledgerService.createTransaction(
          tx,
          { walletId: FUNDS_ON_HOLD_WALLET_ID, amount: authorizedAmount },
          [{ walletId: STRIPE_EGRESS_WALLET_ID, amount: authorizedAmount }],
          `Card Settlement: ${pendingTx.merchantName}`
        );

        // B. Pull the difference directly from User -> Egress
        await this.ledgerService.createTransaction(
          tx,
          { walletId: userWalletId, amount: diff },
          [{ walletId: STRIPE_EGRESS_WALLET_ID, amount: diff }],
          `Card Settlement Adjustment (Overage)`
        );

        // Update User Balance for the difference
        await tx.wallet.update({
          where: { id: userWalletId },
          data: { balance: { decrement: diff } },
        });

      } else if (finalAmount < authorizedAmount) {
        // --- CASE 3: UNDERCHARGE (e.g. Pre-auth release) ---
        // The merchant took LESS than we held. We must refund the difference.
        const diff = authorizedAmount - finalAmount;

        // A. Move only the FINAL amount: Hold -> Egress
        await this.ledgerService.createTransaction(
          tx,
          { walletId: FUNDS_ON_HOLD_WALLET_ID, amount: finalAmount },
          [{ walletId: STRIPE_EGRESS_WALLET_ID, amount: finalAmount }],
          `Card Settlement: ${pendingTx.merchantName}`
        );

        // B. Return the unspent difference: Hold -> User
        await this.ledgerService.createTransaction(
          tx,
          { walletId: FUNDS_ON_HOLD_WALLET_ID, amount: diff },
          [{ walletId: userWalletId, amount: diff }],
          `Card Auth Release (Partial)`
        );

        // Update User Balance (Credit back the difference)
        await tx.wallet.update({
          where: { id: userWalletId },
          data: { balance: { increment: diff } },
        });
      }

      // 3. Finalize Transaction Record
      await tx.cardTransaction.update({
        where: { id: pendingTx.id },
        data: {
          status: CardTransactionStatus.CLEARED,
          providerTxId: stripeTxId,
          amount: finalAmount, // Update to the actual settled amount
          settledAt: new Date(),
        },
      });
      
      this.logger.log(`Transaction ${stripeTxId} successfully settled.`);
    });
  }
}