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
import { Transaction, TransactionType, Currency, PrismaService } from '@flowsplit/prisma';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject('RULE_ENGINE_SERVICE') private readonly ruleEngineClient: ClientProxy,
  ) {}

  /**
   * Processes a verified deposit from a Paystack webhook.
   * @param payload - The validated DTO from the Paystack 'charge.success' event.
   */
  async processPaystackDeposit(
    payload: PaystackChargeSuccessDto,
  ): Promise<void> {
    const { reference, amount, customer, currency } = payload.data;
    this.logger.log(`Processing Paystack deposit for reference: ${reference}`);

    // 1. Idempotency Check
    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });

    if (existingTransaction) {
      this.logger.warn(`Duplicate transaction detected: ${reference}. Skipping.`);
      return;
    }

    // 2. User Mapping via Email
    const user = await this.prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (!user) {
      this.logger.error(`No user found with email: ${customer.email} for transaction ${reference}.`);
      return;
    }

    const upperCaseCurrency = currency.toUpperCase();
    if (!Object.values(Currency).includes(upperCaseCurrency as Currency)) {
      this.logger.error(
        `Unsupported currency '${upperCaseCurrency}' received for transaction ${reference}.`,
      );
      return;
    }
    const currencyEnum = upperCaseCurrency as Currency;

    // 3. Create the Transaction Record
    try {
      const newTransaction = await this.prisma.transaction.create({
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

      this.logger.log(`Successfully recorded transaction ${newTransaction.id} for user ${user.id}`);

      const eventPayload = {
        userId: newTransaction.userId,
        transactionId: newTransaction.id,
        amount: newTransaction.amount,
      };
      this.ruleEngineClient.emit('deposit.received', eventPayload);
      this.logger.log(`Event 'deposit.received' emitted for transaction ${newTransaction.id}`);

    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `Failed to create transaction record for reference: ${reference}`,
          error.stack,
        );
      } else {
        this.logger.error(
          `An unexpected non-Error type was thrown for reference: ${reference}`,
          error,
        );
      }
      
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