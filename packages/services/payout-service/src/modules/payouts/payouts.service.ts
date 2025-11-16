import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService, PayoutStatus } from '@flowsplit/prisma';
import { PaystackService } from '../../paystack/paystack.service';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';
import { createId } from '@paralleldrive/cuid2';
import { LedgerService } from '../../ledger/ledger.service';
import { FUNDS_IN_TRANSIT_WALLET_ID, PAYSTACK_EGRESS_WALLET_ID } from '../../system/system-wallets.service';
import { PaystackTransferSuccessDto, PaystackTransferFailedDto } from './dto/paystack-webhook.dto';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Initiates a payout from a user's wallet to a linked bank account.
   * Fully atomic and ledger-aware.
   */
  async initiate(userId: string, data: InitiatePayoutDto) {
    const { sourceWalletId, destinationBankId, amount, reference } = data;
    const amountBigInt = BigInt(amount);

    this.logger.log(`Initiating payout for user ${userId} with reference ${reference}`);

    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Verify ownership and validity
      const [sourceWallet, destinationBank] = await Promise.all([
        tx.wallet.findFirst({ where: { id: sourceWalletId, userId } }),
        tx.bankAccount.findFirst({ where: { id: destinationBankId, userId } }),
      ]);

      if (!sourceWallet) throw new NotFoundException('Source wallet not found or unauthorized.');
      if (!destinationBank) throw new NotFoundException('Destination bank account not found or unauthorized.');
      if (!destinationBank.isVerified) throw new BadRequestException('Destination bank account not verified.');
      if (!destinationBank.providerRef) throw new BadRequestException('Destination bank account missing provider reference.');
      if (sourceWallet.balance < amountBigInt) throw new BadRequestException('Insufficient funds in source wallet.');

      const existingPayout = await tx.payout.findUnique({ where: { reference } });
      if (existingPayout) throw new ConflictException('A payout with this reference already exists.');

      // 2️⃣ Create payout record (PENDING)
      const newPayout = await tx.payout.create({
        data: {
          id: createId(),
          userId,
          sourceWalletId,
          destinationBankId,
          amount: amountBigInt,
          currency: sourceWallet.currency,
          reference,
          status: PayoutStatus.PENDING,
        },
      });

      // 3️⃣ Reserve funds in ledger (Funds in Transit)
      const ledgerTxId = await this.ledgerService.createTransaction(
        tx,
        { walletId: sourceWalletId, amount: amountBigInt },
        [{ walletId: FUNDS_IN_TRANSIT_WALLET_ID, amount: amountBigInt }],
        `Reserve funds for payout ref: ${reference}`
      );

      // 4️⃣ Update wallet balance & link ledger to payout
      await tx.wallet.update({
        where: { id: sourceWalletId },
        data: { balance: { decrement: amountBigInt } },
      });

      await tx.payout.update({
        where: { id: newPayout.id },
        data: { ledgerTransactionId: ledgerTxId },
      });

      // 5️⃣ Initiate transfer via Paystack
      try {
        const transferResult = await this.paystackService.initiateTransfer(
          amount,
          reference,
          destinationBank.providerRef,
        );

        await tx.payout.update({
          where: { id: newPayout.id },
          data: {
            status: PayoutStatus.PROCESSING,
            providerReference: transferResult.transfer_code,
          },
        });
      } catch (error) {
        this.logger.error(`Paystack transfer initiation failed for ref ${reference}`, error);
        throw new InternalServerErrorException('Failed to initiate transfer with Paystack.');
      }

      this.logger.log(`Payout ${newPayout.id} successfully initiated`);
      return {
        message: 'Payout initiated successfully. Transfer is processing.',
        payoutId: newPayout.id,
        status: PayoutStatus.PROCESSING,
      };
    });
  }

  /**
   * Handles 'transfer.success' webhook from Paystack.
   * Idempotent: only updates if payout not already terminal.
   */
  async handleTransferSuccess(payload: PaystackTransferSuccessDto): Promise<void> {
    const { reference } = payload.data;
    this.logger.log(`'transfer.success' webhook received for ref ${reference}`);

    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { providerReference: reference } });
      if (!payout) {
        this.logger.warn(`Unknown payout ref ${reference} in transfer.success webhook. Ignored.`);
        return;
      }

      if (payout.status === PayoutStatus.SUCCESS || payout.status === PayoutStatus.FAILED) {
        this.logger.log(`Payout ${payout.id} already terminal (${payout.status}).`);
        return;
      }

      await this.ledgerService.createTransaction(
        tx,
        { walletId: FUNDS_IN_TRANSIT_WALLET_ID, amount: payout.amount },
        [{ walletId: PAYSTACK_EGRESS_WALLET_ID, amount: payout.amount }],
        `Payout SUCCESS: Final egress for ref ${payout.reference}`
      );

      await tx.payout.update({
        where: { id: payout.id },
        data: { status: PayoutStatus.SUCCESS, completedAt: new Date() },
      });

      this.logger.log(`Payout ${payout.id} marked as SUCCESS`);
    });
  }

  /**
   * Handles 'transfer.failed' webhook from Paystack.
   * Idempotent: only reverses funds if payout not already terminal.
   */
  async handleTransferFailed(payload: PaystackTransferFailedDto): Promise<void> {
    const { reference, failure_reason } = payload.data;
    this.logger.warn(`'transfer.failed' webhook received for ref ${reference}`);

    await this.prisma.$transaction(async (tx) => {
      const payout = await tx.payout.findUnique({ where: { providerReference: reference } });
      if (!payout) {
        this.logger.warn(`Unknown payout ref ${reference} in transfer.failed webhook. Ignored.`);
        return;
      }

      if (payout.status === PayoutStatus.SUCCESS || payout.status === PayoutStatus.FAILED) {
        this.logger.log(`Payout ${payout.id} already terminal (${payout.status}).`);
        return;
      }

      // Reverse ledger transaction
      await this.ledgerService.createTransaction(
        tx,
        { walletId: FUNDS_IN_TRANSIT_WALLET_ID, amount: payout.amount },
        [{ walletId: payout.sourceWalletId, amount: payout.amount }],
        `Payout FAILED: Reversal for ref ${payout.reference}`
      );

      // Refund user wallet
      await tx.wallet.update({
        where: { id: payout.sourceWalletId },
        data: { balance: { increment: payout.amount } },
      });

      // Update payout status
      await tx.payout.update({
        where: { id: payout.id },
        data: {
          status: PayoutStatus.FAILED,
          failureReason: failure_reason || 'Unknown reason from Paystack',
          completedAt: new Date(),
        },
      });

      this.logger.warn(`Payout ${payout.id} marked as FAILED. Funds returned to user.`);
    });
  }
}
