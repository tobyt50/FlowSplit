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
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { LimitService } from '@flowsplit/limits';

type PrismaTransactionClient = Prisma.TransactionClient;

@Injectable()
export class WalletsService {
  private readonly logger = new Logger(WalletsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly limitService: LimitService,
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
      where: { userId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findUserWalletById(userId: string, walletId: string) {
    this.logger.log(`Fetching wallet ${walletId} for user ${userId}`);
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId: userId, deletedAt: null },
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
   */
  async deleteWallet(userId: string, walletId: string, targetWalletId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Validate Ownership
      const walletToDelete = await tx.wallet.findFirst({ 
        where: { id: walletId, userId, deletedAt: null } 
      });
      if (!walletToDelete) throw new NotFoundException('Wallet not found or already deleted.');

      if (walletToDelete.type === 'SOURCE') {
         throw new BadRequestException('Cannot delete the System Source wallet.');
      }
      if (walletToDelete.name === 'Primary') {
        throw new BadRequestException('Cannot delete your Primary default wallet.');
      }

      // 2. Handle Funds Transfer (Sweep)
      if (walletToDelete.balance > 0n) {
        if (!targetWalletId) {
          throw new BadRequestException('This wallet has funds. You must specify a target wallet to transfer them to.');
        }
        
        const targetWallet = await tx.wallet.findFirst({ where: { id: targetWalletId, userId, deletedAt: null } });
        if (!targetWallet) throw new NotFoundException('Target wallet not found.');
        if (targetWallet.id === walletToDelete.id) throw new BadRequestException('Target wallet cannot be the same as the deleted wallet.');

        await this.ledgerService.createTransaction(
          tx,
          { walletId: walletToDelete.id, amount: walletToDelete.balance },
          [{ walletId: targetWallet.id, amount: walletToDelete.balance }],
          `Wallet Closure: Sweep funds from ${walletToDelete.name} to ${targetWallet.name}`
        );

        await tx.wallet.update({
          where: { id: targetWallet.id },
          data: { balance: { increment: walletToDelete.balance } },
        });
        
        // Zero out the deleted wallet's balance for clarity
        await tx.wallet.update({
            where: { id: walletToDelete.id },
            data: { balance: 0n }
        });
      }

      // 3. Disable associated Split Rules - UNCHANGED
      await tx.splitRule.updateMany({
        where: { destinationWalletId: walletId },
        data: { isActive: false, destinationWalletId: null },
      });

      // 4. Soft Delete the Wallet - THE FIX
      // Instead of .delete(), we update the deletedAt timestamp.
      await tx.wallet.update({
        where: { id: walletId },
        data: { deletedAt: new Date() },
      });

      this.logger.log(`Wallet ${walletId} closed (soft deleted) by user ${userId}.`);
    });
  }

  /**
   * Transfers funds between two wallets owned by the same user.
   * Atomic and Ledger-backed.
   */
  /**
   * Transfers funds between two wallets owned by the same user.
   * Atomic, Ledger-backed, and Limit-enforced.
   */
  async transferFunds(userId: string, fromWalletId: string, toWalletId: string, amount: bigint) {
    if (fromWalletId === toWalletId) {
      throw new BadRequestException('Source and destination wallets cannot be the same.');
    }

    // 1. LIMIT CHECK & RESERVATION (SOTA Pattern)
    // We check and increment the limit in Redis BEFORE starting the database transaction.
    // This allows for high-performance gating without locking database rows.
    await this.limitService.checkAndRecordLimit(userId, amount, 'INTERNAL_TRANSFER');

    try {
      // 2. EXECUTE ATOMIC TRANSACTION
      return await this.prisma.$transaction(async (tx) => {
        // A. Verify Ownership & Balances
        const [source, destination] = await Promise.all([
          tx.wallet.findFirst({ where: { id: fromWalletId, userId } }),
          tx.wallet.findFirst({ where: { id: toWalletId, userId } }),
        ]);

        if (!source) throw new NotFoundException('Source wallet not found.');
        if (!destination) throw new NotFoundException('Destination wallet not found.');
        if (source.balance < amount) throw new BadRequestException('Insufficient funds.');

        // B. Create Ledger Record (The Source of Truth)
        await this.ledgerService.createTransaction(
          tx,
          { walletId: source.id, amount },
          [{ walletId: destination.id, amount }],
          `Internal Transfer: ${source.name} -> ${destination.name}`
        );

        // C. Update Cached Balances (For Read Performance)
        await tx.wallet.update({
          where: { id: source.id },
          data: { balance: { decrement: amount } },
        });
        await tx.wallet.update({
          where: { id: destination.id },
          data: { balance: { increment: amount } },
        });

        this.logger.log(`Transferred ${amount} from ${source.id} to ${destination.id}`);
        return { success: true, from: source.name, to: destination.name, amount: amount.toString() };
      });

    } catch (error) {
      // 3. COMPENSATION (Rollback Limit)
      // If the DB transaction failed (e.g. concurrency, insufficient funds race condition),
      // we must release the limit reservation so the user isn't penalized.
      this.logger.warn(`Transfer failed for user ${userId}. Rolling back limit usage.`);
      await this.limitService.rollbackUsage(userId, amount);
      
      throw error; // Re-throw the error to the client
    }
  }

  /**
   * Updates a wallet's metadata (Name, Target Amount).
   */
  async update(userId: string, walletId: string, data: UpdateWalletDto) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found or you do not have permission to edit it.');
    }

    // Convert number to BigInt if provided
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.targetAmount !== undefined) updateData.targetAmount = BigInt(data.targetAmount);

    this.logger.log(`Updating wallet ${walletId} for user ${userId}`);
    
    return this.prisma.wallet.update({
      where: { id: walletId },
      data: updateData,
    });
  }
}