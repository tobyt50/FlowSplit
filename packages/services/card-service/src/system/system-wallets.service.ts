import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaService, WalletType } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

export const FUNDS_ON_HOLD_WALLET_ID = 'sys_card_holds_liability';
export const STRIPE_EGRESS_WALLET_ID = 'sys_stripe_egress';

@Injectable()
export class SystemWalletsService implements OnModuleInit {
  private readonly logger = new Logger(SystemWalletsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    // 1. Liability Wallet: Where funds sit while "Authorized" but not "Settled"
    await this.findOrCreateSystemWallet(
      FUNDS_ON_HOLD_WALLET_ID,
      'Card Authorizations (Liability)',
      WalletType.LIABILITY
    );

    // 2. Egress Wallet: Where funds go when paid out to Stripe merchants
    await this.findOrCreateSystemWallet(
      STRIPE_EGRESS_WALLET_ID,
      'Stripe Settlement Egress',
      WalletType.SOURCE // Functions as a sink/source
    );
    
    this.logger.log('Card System wallets verified.');
  }

  private async findOrCreateSystemWallet(id: string, name: string, type: WalletType) {
    const wallet = await this.prisma.wallet.findUnique({ where: { id } });
    if (!wallet) {
      this.logger.log(`Creating system wallet: ${name}`);
      await this.prisma.wallet.create({
        data: {
          id,
          name,
          type,
          // userId is null
        },
      });
    }
  }
}