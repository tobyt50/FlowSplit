import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { Prisma, PrismaService, WalletType } from '@flowsplit/prisma';
import { LedgerService } from '../ledger/ledger.service';
import { createId } from '@paralleldrive/cuid2';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

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
      
      const newWalletId = createId();
      const newWallet = await tx.wallet.create({
        data: {
          id: newWalletId,
          ...createWalletDto,
          userId: userId,
        },
      });

      await this.ledgerService.createWalletCreationTransaction(
        tx,
        newWallet.id,
        `Initial creation of wallet: ${newWallet.name}`
      );

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
      const newWalletId = createId();
      await tx.wallet.create({
        data: {
          id: newWalletId,
          name: 'Primary',
          type: WalletType.PERSONAL,
          currency: 'NGN',
          userId: userId,
        },
      });
      
      // Also record the creation of the primary wallet in the ledger
      await this.ledgerService.createWalletCreationTransaction(
        tx,
        newWalletId,
        'Initial creation of wallet: Primary'
      );
    }
  }

  /**
   * Performs a "Sweep and Close" operation.
   * 1. Checks balance.
   * 2. If balance > 0, transfers ALL funds to a target wallet via Ledger.
   * 3. Disables all split rules pointing to this wallet.
   * 4. Deletes the wallet.
   */
  async deleteWallet(userId: string, walletId: string, targetWalletId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Ownership
      const walletToDelete = await tx.wallet.findFirst({ where: { id: walletId, userId } });
      if (!walletToDelete) throw new NotFoundException('Wallet to delete not found.');

      if (walletToDelete.type === 'PERSONAL') {
        throw new BadRequestException('Cannot delete your Primary Personal wallet.');
      }

      // 2. Handle Funds Transfer (Sweep)
      if (walletToDelete.balance > 0n) {
        if (!targetWalletId) {
          throw new BadRequestException('This wallet has funds. You must specify a target wallet to transfer them to.');
        }
        
        const targetWallet = await tx.wallet.findFirst({ where: { id: targetWalletId, userId } });
        if (!targetWallet) throw new NotFoundException('Target wallet not found.');
        if (targetWallet.id === walletToDelete.id) throw new BadRequestException('Target wallet cannot be the same as the deleted wallet.');

        // Create Ledger Transaction for the Sweep
        await this.ledgerService.createTransaction(
          tx,
          { walletId: walletToDelete.id, amount: walletToDelete.balance },
          [{ walletId: targetWallet.id, amount: walletToDelete.balance }],
          `Wallet Closure: Sweep funds from ${walletToDelete.name} to ${targetWallet.name}`
        );

        // Update Target Balance
        await tx.wallet.update({
          where: { id: targetWallet.id },
          data: { balance: { increment: walletToDelete.balance } },
        });
      }

      // 3. Disable associated Split Rules
      // We do not delete them, we disable them so the user sees their total % drop and can reallocate manually.
      // Deleting/Recalculating automatically is dangerous assumptions.
      await tx.splitRule.updateMany({
        where: { destinationWalletId: walletId },
        data: { isActive: false, destinationWalletId: null }, // Detach the rule
      });

      // 4. Delete the Wallet
      await tx.wallet.delete({ where: { id: walletId } });

      this.logger.log(`Wallet ${walletId} deleted by user ${userId}. Funds swept to ${targetWalletId || 'N/A'}.`);
    });
  }
}