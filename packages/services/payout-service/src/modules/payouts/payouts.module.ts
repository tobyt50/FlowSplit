import { Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { PaystackModule } from '../../paystack/paystack.module';
import { LedgerModule } from '../../ledger/ledger.module';

@Module({
  imports: [
    PaystackModule, // Provides PaystackService
    LedgerModule,   // Provides LedgerService
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}