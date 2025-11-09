import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { Prisma, PrismaService, WalletType } from '@flowsplit/prisma';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Atomically creates a new wallet for a user.
   * It also ensures a primary 'PERSONAL' wallet exists before creating another wallet.
   */
  async create(userId: string, createWalletDto: CreateWalletDto) {
    this.logger.log(`Attempting to create wallet '${createWalletDto.name}' for user ${userId}`);

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await this.findOrCreatePrimaryWallet(userId, tx);

      const existingWallet = await tx.wallet.findFirst({
        where: { userId, name: createWalletDto.name },
      });
      if (existingWallet) {
        throw new ConflictException(`Wallet with name '${createWalletDto.name}' already exists.`);
      }

      const newWallet = await tx.wallet.create({
        data: {
          ...createWalletDto,
          userId: userId,
        },
      });

      this.logger.log(`Successfully created wallet ${newWallet.id} for user ${userId}`);
      return newWallet;
    });
  }

  async findAllForUser(userId: string) {
    this.logger.log(`Fetching all wallets for user ${userId}`);
    return this.prisma.wallet.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findUserWalletById(userId: string, walletId: string) {
    this.logger.log(`Fetching wallet ${walletId} for user ${userId}`);
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId: userId },
    });

    if (!wallet) {
      this.logger.warn(`Wallet ${walletId} not found for user ${userId}`);
      throw new NotFoundException('Wallet not found or you do not have permission to access it.');
    }
    return wallet;
  }

  /**
   * An internal, idempotent helper to find or create a user's primary wallet.
   * Must be called within a transaction.
   */
  private async findOrCreatePrimaryWallet(
    userId: string,
    tx: PrismaTransactionClient,
  ) {
    const primaryWallet = await tx.wallet.findFirst({
      where: { userId, type: WalletType.PERSONAL },
    });

    if (!primaryWallet) {
      this.logger.log(`Primary wallet not found for user ${userId}. Creating one.`);
      await tx.wallet.create({
        data: {
          name: 'Primary',
          type: WalletType.PERSONAL,
          currency: 'NGN',
          userId: userId,
        },
      });
    }
  }
}