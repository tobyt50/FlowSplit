import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService, WalletType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

// Exporting the ID as a constant prevents "magic strings" in other parts of the code,
// reducing the risk of typos and making the code easier to maintain.
export const WALLET_CREATION_SOURCE_ID = 'sys_wallet_creation';

@Injectable()
export class SystemWalletsService implements OnModuleInit {
  private readonly logger = new Logger(SystemWalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * This NestJS lifecycle hook is called once the module has been initialized.
   * We use it to verify that our essential system wallets exist in the database.
   */
  async onModuleInit() {
    this.logger.log('Verifying system wallets...');
    await this.findOrCreateSystemWallet(
      WALLET_CREATION_SOURCE_ID,
      'System: Wallet Creation Source',
      WalletType.SOURCE // Using SOURCE type is appropriate
    );
    // In the future, other system wallets like "Paystack Ingress" or "System Equity"
    // would also be added here.

    this.logger.log('System wallets are ready.');
  }

  /**
   * An idempotent function to find a system wallet by its well-known ID,
   * or create it if it does not exist.
   * @param id The well-known, static ID of the system wallet.
   * @param name The human-readable name for the wallet.
   * @param type The type of the wallet.
   */
  private async findOrCreateSystemWallet(id: string, name: string, type: WalletType) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!wallet) {
      this.logger.log(`System wallet "${name}" (ID: ${id}) not found. Creating it...`);
      try {
        await this.prisma.wallet.create({
          data: {
            id,
            name,
            type,
          },
        });
        this.logger.log(`Successfully created system wallet "${name}".`);
      } catch (error) {
        this.logger.error(`Failed to create system wallet "${name}".`, error);
        // Throwing an error here would prevent the application from starting,
        // which is the correct behavior if a critical system component cannot be created.
        throw error;
      }
    }
  }
}