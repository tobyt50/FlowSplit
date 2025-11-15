import {
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import {
  Transaction,
  TransactionType,
  Currency,
  PrismaService,
  WalletType,
} from '@flowsplit/prisma';
import { ClientProxy } from '@nestjs/microservices';
import { LedgerService } from '../ledger/ledger.service'; // Import the new LedgerService
import { PAYSTACK_INGRESS_WALLET_ID } from '../system/system-wallets.service'; // Import the system wallet ID
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService, // Inject the LedgerService
    @Inject('RULE_ENGINE_SERVICE') private readonly ruleEngineClient: ClientProxy,
  ) {}

  /**
   * Processes a verified deposit from a Paystack webhook.
   * This method is now fully atomic and creates an auditable double-entry ledger transaction.
   * @param payload - The validated DTO from the Paystack 'charge.success' event.
   */
  async processPaystackDeposit(payload: PaystackChargeSuccessDto): Promise<void> {
    const { reference, amount, customer, currency } = payload.data;
    this.logger.log(`Processing Paystack deposit for reference: ${reference}`);

    // Idempotency Check: Perform this check before starting the database transaction for efficiency.
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (existingTransaction) {
      this.logger.warn(`Duplicate transaction detected: ${reference}. Skipping.`);
      return;
    }

    // User and Currency validation before the transaction
    const user = await this.prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (!user) {
      this.logger.error(`No user found with email: ${customer.email} for transaction ${reference}.`);
      return;
    }

    const upperCaseCurrency = currency.toUpperCase();
    if (!Object.values(Currency).includes(upperCaseCurrency as Currency)) {
      this.logger.error(`Unsupported currency '${upperCaseCurrency}' received for transaction ${reference}.`);
      return;
    }
    const currencyEnum = upperCaseCurrency as Currency;

    try {
      // --- ATOMIC TRANSACTION BOUNDARY START ---
      await this.prisma.$transaction(async (tx) => {
        // 1. Find-or-Create the user's "Unallocated Funds" (SOURCE) wallet.
        // This is the destination for all incoming deposits before they are split.
        let userSourceWallet = await tx.wallet.findFirst({
          where: { userId: user.id, type: WalletType.SOURCE },
        });

        if (!userSourceWallet) {
          const newWalletId = createId();
          userSourceWallet = await tx.wallet.create({
            data: {
              id: newWalletId,
              name: 'Unallocated Funds',
              type: WalletType.SOURCE,
              userId: user.id,
              currency: currencyEnum,
            },
          });
          // Create the auditable record for this new wallet's creation
          await this.ledgerService.createWalletCreationTransaction(
            tx,
            newWalletId,
            'Initial creation of wallet: Unallocated Funds'
          );
        }

        // 2. Create the auditable double-entry ledger transaction for the deposit.
        // This moves funds from the "outside world" (Paystack Ingress) into the user's source wallet.
        await this.ledgerService.createTransaction(
          tx,
          { walletId: PAYSTACK_INGRESS_WALLET_ID, amount: BigInt(amount) },
          [{ walletId: userSourceWallet.id, amount: BigInt(amount) }],
          `Paystack deposit for user ${user.email} with ref: ${reference}`
        );

        // 3. Update the cached balance on the user's source wallet.
        await tx.wallet.update({
          where: { id: userSourceWallet.id },
          data: { balance: { increment: BigInt(amount) } },
        });

        // 4. Create the external-facing Transaction record for history.
        const newTransaction = await tx.transaction.create({
          data: {
            userId: user.id,
            reference: reference,
            amount: BigInt(amount),
            currency: currencyEnum,
            type: TransactionType.CREDIT,
            status: 'SUCCESS',
            splitApplied: false,
            description: 'Paystack Deposit',
          },
        });

        // 5. Emit the event to the rule engine to trigger the split.
        // This is done last, only after all database work is successfully committed.
        const eventPayload = {
          userId: newTransaction.userId,
          transactionId: newTransaction.id,
          amount: newTransaction.amount,
        };
        this.ruleEngineClient.emit('deposit.received', eventPayload);
        this.logger.log(`Event 'deposit.received' emitted for transaction ${newTransaction.id}`);
      });
      // --- ATOMIC TRANSACTION BOUNDARY END ---

      this.logger.log(`Successfully recorded ledger entries for transaction ${reference}`);

    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to process transaction for reference: ${reference}`, error.stack);
      } else {
        this.logger.error(`An unexpected non-Error type was thrown for reference: ${reference}`, error);
      }
      // We throw an error to let the webhook provider know that processing failed
      // and that it should retry sending the webhook later.
      throw new InternalServerErrorException('Could not record the transaction.');
    }
  }

  /**
   * Retrieves all transactions for a specific, authenticated user.
   */
  async findAllForUser(userId: string): Promise<Transaction[]> {
    return this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { initiatedAt: 'desc' },
    });
  }
}