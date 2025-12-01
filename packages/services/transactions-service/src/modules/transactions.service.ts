import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import {
  Transaction,
  TransactionType,
  Currency,
  PrismaService,
  WalletType,
  Prisma,
} from '@flowsplit/prisma';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { LedgerService } from '../ledger/ledger.service';
import { PAYSTACK_INGRESS_WALLET_ID } from '../system/system-wallets.service';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    @Inject('RULE_ENGINE_SERVICE') private readonly ruleEngineClient: ClientProxy,
    @Inject('NOTIFICATION_SERVICE') private readonly notificationClient: ClientProxy,
  ) {}

  async processPaystackDeposit(payload: PaystackChargeSuccessDto): Promise<void> {
    if (!payload || !payload.data) {
      this.logger.error('Invalid payload structure: missing data object');
      return;
    }
    const { reference, amount, customer, currency, status } = payload.data;
    if (!reference) {
      this.logger.error('Invalid payload: missing reference in data object');
      return;
    }

    this.logger.log(`Processing Paystack deposit for reference: ${reference}`);

    const existingTransaction = await this.prisma.transaction.findUnique({
      where: { reference },
    });
    if (existingTransaction) {
      this.logger.warn(`Duplicate transaction detected: ${reference}. Skipping.`);
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { email: customer.email },
    });
    if (!user) {
      this.logger.error(`No user found with email: ${customer.email} for transaction ${reference}.`);
      return;
    }

    const upperCaseCurrency = currency ? currency.toUpperCase() : 'NGN';
    if (!Object.values(Currency).includes(upperCaseCurrency as Currency)) {
      this.logger.error(`Unsupported currency '${upperCaseCurrency}' for transaction ${reference}.`);
      return;
    }
    const currencyEnum = upperCaseCurrency as Currency;

    try {
      await this.prisma.$transaction(async (tx) => {
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
          await this.ledgerService.createWalletCreationTransaction(
            tx,
            newWalletId,
            'Initial creation of wallet: Unallocated Funds'
          );
        }

        await this.ledgerService.createTransaction(
          tx,
          { walletId: PAYSTACK_INGRESS_WALLET_ID, amount: BigInt(amount) },
          [{ walletId: userSourceWallet.id, amount: BigInt(amount) }],
          `Paystack deposit for user ${user.email} with ref: ${reference}`
        );

        await tx.wallet.update({
          where: { id: userSourceWallet.id },
          data: { balance: { increment: BigInt(amount) } },
        });

        const newTransaction = await tx.transaction.create({
          data: {
            userId: user.id,
            reference: reference,
            amount: BigInt(amount),
            currency: currencyEnum,
            type: TransactionType.CREDIT,
            status: status.toUpperCase(),
            splitApplied: false,
            description: 'Paystack Deposit',
          },
        });

        const eventPayload = {
          userId: newTransaction.userId,
          transactionId: newTransaction.id,
          amount: newTransaction.amount,
        };
        
        const record = new RmqRecordBuilder(eventPayload)
            .setOptions({ messageId: newTransaction.id })
            .build();

        this.ruleEngineClient.emit('deposit.received', record);
        this.notificationClient.emit('deposit.received', record);

        this.logger.log(`Events for 'deposit.received' emitted for transaction ${newTransaction.id} to rule-engine and notifications`);
      });

      this.logger.log(`Successfully recorded ledger entries for transaction ${reference}`);
    } catch (error) {
      this.logger.error(`Failed to process transaction for reference: ${reference}`, error instanceof Error ? error.stack : error);
      throw new InternalServerErrorException('Could not record the transaction.');
    }
  }

  async findAllForUser(userId: string, walletId?: string): Promise<Transaction[]> {
    const whereClause: Prisma.TransactionWhereInput = { userId };
    if (walletId) {
      whereClause.walletId = walletId;
    }

    return this.prisma.transaction.findMany({
      where: whereClause,
      orderBy: { initiatedAt: 'desc' },
      take: 50,
    });
  }

  async findOneById(userId: string, id: string): Promise<Transaction> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, userId },
      include: {
        ledgerTransaction: {
          include: {
            entries: {
              include: {
                wallet: { select: { name: true } },
              },
              orderBy: { type: 'desc' },
            },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found or you do not have permission to view it.');
    }
    return transaction;
  }
}