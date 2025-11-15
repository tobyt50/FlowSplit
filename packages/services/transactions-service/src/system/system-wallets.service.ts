import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService, WalletType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

export const PAYSTACK_INGRESS_WALLET_ID = 'sys_paystack_ingress';
export const WALLET_CREATION_SOURCE_ID = 'sys_wallet_creation';

@Injectable()
export class SystemWalletsService implements OnModuleInit {
  private readonly logger = new Logger(SystemWalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.findOrCreateSystemWallet(
      PAYSTACK_INGRESS_WALLET_ID,
      'Paystack Ingress',
    );
    await this.findOrCreateSystemWallet(
      WALLET_CREATION_SOURCE_ID,
      'Wallet Creation Source',
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
        },
      });
    }
  }
}