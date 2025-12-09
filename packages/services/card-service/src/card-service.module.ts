import { Module } from '@nestjs/common';
import { CardsModule } from './modules/cards/cards.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    SystemModule, // Ensures system wallets are created
    CardsModule,  // Handles card issuance (HTTP)
    WebhooksModule, // Handles Stripe events (HTTP)
  ],
})
export class CardServiceModule {}