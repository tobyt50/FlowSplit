import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, WalletType, LedgerEntryType, CardStatus } from '@flowsplit/prisma';
import { LedgerService } from '../../ledger/ledger.service';
import { FUNDS_ON_HOLD_WALLET_ID } from '../../system/system-wallets.service';

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Handles an incoming authorization request (swipe).
   * returns { approved: boolean, reason?: string }
   */
  async handleAuthorizationRequest(
    stripeAuthId: string,
    amount: bigint, // kobo/cents
    merchantName: string,
    cardId: string // The Stripe Card ID
  ): Promise<{ approved: boolean; reason?: string }> {
    
    // --- ATOMIC TRANSACTION START ---
    // We must lock the wallet balance to prevent race conditions (double spend)
    return this.prisma.$transaction(async (tx) => {
      // 1. Find the FlowSplit Card and Linked Wallet
      const card = await tx.virtualCard.findUnique({
        where: { providerCardId: cardId },
        include: { wallet: true },
      });

      if (!card) {
        this.logger.error(`Card not found for provider ID: ${cardId}`);
        return { approved: false, reason: 'card_inactive' };
      }

      if (card.status !== CardStatus.ACTIVE) {
        return { approved: false, reason: 'card_inactive' };
      }

      // 2. Check Balance
      // Can the wallet afford this transaction?
      if (card.wallet.balance < amount) {
        this.logger.warn(`Declined auth ${stripeAuthId}: Insufficient funds in wallet ${card.wallet.name}`);
        return { approved: false, reason: 'insufficient_funds' };
      }

      // 3. APPROVE: Create a "HOLD" in the Ledger
      // We DO NOT debit the user yet (expense). We debit their wallet and credit a "Liability/Hold" wallet.
      // This reserves the funds so they can't be spent elsewhere.
      await this.ledgerService.createTransaction(
        tx,
        { walletId: card.walletId, amount: amount }, // Debit User Wallet
        [{ walletId: FUNDS_ON_HOLD_WALLET_ID, amount: amount }], // Credit System Hold Wallet
        `Card Auth Hold: ${merchantName}`
      );

      // 4. Create Pending Transaction Record
      await tx.cardTransaction.create({
        data: {
          id: stripeAuthId, // Use Stripe Auth ID as our ID for easy lookup
          cardId: card.id,
          amount,
          currency: card.currency,
          merchantName,
          status: 'PENDING',
          providerAuthId: stripeAuthId,
        },
      });

      // 5. Update Cached Balance
      await tx.wallet.update({
        where: { id: card.walletId },
        data: { balance: { decrement: amount } },
      });

      this.logger.log(`Approved auth ${stripeAuthId} for ${merchantName}`);
      return { approved: true };
    });
    // --- ATOMIC TRANSACTION END ---
  }
}