import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService, WalletType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

// Define and export all required system wallet IDs for consistency
export const WALLET_CREATION_SOURCE_ID = 'sys_wallet_creation';
export const FUNDS_IN_TRANSIT_WALLET_ID = 'sys_funds_in_transit';

@Injectable()
export class SystemWalletsService implements OnModuleInit {
  private readonly logger = new Logger(SystemWalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Runs on application startup to guarantee essential system wallets are in place.
   */
  async onModuleInit() {
    // This wallet is used for the zero-amount creation entry in the ledger
    await this.findOrCreateSystemWallet(
      WALLET_CREATION_SOURCE_ID,
      'Wallet Creation Source',
    );
    // This wallet holds funds that are reserved for a pending payout
    await this.findOrCreateSystemWallet(
      FUNDS_IN_TRANSIT_WALLET_ID,
      'Funds in Transit',
    );
    this.logger.log('System wallets verified and ready.');
  }

  private async findOrCreateSystemWallet(id: string, name: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      this.logger.log(`System wallet "${name}" not found. Creating it...`);
      await this.prisma.wallet.create({
        data: {
          id,
          name,
          type: WalletType.SOURCE,
          // userId is null for system wallets
        },
      });
    }
  }
}