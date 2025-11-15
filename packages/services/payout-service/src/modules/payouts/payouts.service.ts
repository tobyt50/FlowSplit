import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService, PayoutStatus, LedgerEntryType } from '@flowsplit/prisma';
import { PaystackService } from '../../paystack/paystack.service';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';
import { createId } from '@paralleldrive/cuid2';
import { LedgerService } from '../../ledger/ledger.service';
import { FUNDS_IN_TRANSIT_WALLET_ID } from 'src/system/system-wallets.service';

@Injectable()
export class PayoutsService {
  private readonly logger = new Logger(PayoutsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Initiates a payout from a user's smart-wallet to a linked external bank account.
   * This process is atomic and ledger-aware.
   */
  async initiate(userId: string, data: InitiatePayoutDto) {
    const { sourceWalletId, destinationBankId, amount, reference } = data;
    const amountBigInt = BigInt(amount);

    this.logger.log(`Payout initiation received for user ${userId} with reference ${reference}`);

    // --- ATOMIC TRANSACTION BOUNDARY START ---
    return this.prisma.$transaction(async (tx) => {
      // 1. VERIFY OWNERSHIP AND DATA INTEGRITY (Read-heavy checks first)
      const [sourceWallet, destinationBank] = await Promise.all([
        tx.wallet.findFirst({ where: { id: sourceWalletId, userId } }),
        tx.bankAccount.findFirst({ where: { id: destinationBankId, userId } }),
      ]);

      if (!sourceWallet) throw new NotFoundException('Source wallet not found or you do not have permission to use it.');
      if (!destinationBank) throw new NotFoundException('Destination bank account not found or you do not have permission to use it.');
      if (!destinationBank.isVerified) throw new BadRequestException('The destination bank account is not verified.');
      if (!destinationBank.providerRef) throw new BadRequestException('The destination bank account is missing provider reference for transfers.');
      if (sourceWallet.balance < amountBigInt) throw new BadRequestException('Insufficient funds in the source wallet.');
      
      const existingPayout = await tx.payout.findUnique({ where: { reference } });
      if (existingPayout) throw new ConflictException('A payout with this reference already exists.');


      // 2. CREATE PAYOUT RECORD
      // We create the record first in a PENDING state.
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

      // 3. CREATE THE "FUNDS RESERVATION" IN THE LEDGER
      // This is the most critical step. We move the funds from the user's
      // wallet into a system-level "Funds in Transit" wallet. The user can
      // no longer access these funds, preventing a double-spend.
      const ledgerTxId = await this.ledgerService.createTransaction(
        tx,
        { walletId: sourceWalletId, amount: amountBigInt },
        [{ walletId: FUNDS_IN_TRANSIT_WALLET_ID, amount: amountBigInt }],
        `Reserve funds for payout ref: ${reference}`
      );

      // 4. UPDATE CACHED BALANCE & LINK LEDGER TO PAYOUT
      await tx.wallet.update({
        where: { id: sourceWalletId },
        data: { balance: { decrement: amountBigInt } },
      });
      await tx.payout.update({
        where: { id: newPayout.id },
        data: { ledgerTransactionId: ledgerTxId },
      });
      
      // 5. INITIATE THE TRANSFER WITH THE PAYMENT PROVIDER (Paystack)
      // This is done *last*. If this step fails, the entire transaction rolls back,
      // the funds are returned to the user's wallet in the ledger, and no harm is done.
      try {
        const transferResult = await this.paystackService.initiateTransfer(
          amount,
          reference,
          destinationBank.providerRef,
        );
        
        // If API call is successful, update the payout record with the provider's reference
        await tx.payout.update({
          where: { id: newPayout.id },
          data: { 
            status: PayoutStatus.PROCESSING,
            providerReference: transferResult.transfer_code,
          },
        });

      } catch (error) {
        this.logger.error(`Paystack transfer initiation failed for ref ${reference}. Rolling back transaction.`, error);
        // Throwing an error here will automatically trigger the rollback of the entire Prisma transaction.
        throw new InternalServerErrorException('Failed to initiate transfer with payment provider.');
      }

      this.logger.log(`Successfully initiated payout ${newPayout.id} for user ${userId}`);
      return {
        message: 'Payout initiation successful. The transfer is now processing.',
        payoutId: newPayout.id,
        status: PayoutStatus.PROCESSING,
      };
    });
    // --- ATOMIC TRANSACTION BOUNDARY END ---
  }
}