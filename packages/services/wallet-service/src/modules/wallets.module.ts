import { forwardRef, Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { LedgerModule } from '../ledger/ledger.module';
import { LimitModule } from '@flowsplit/limits';

@Module({
  imports: [
    LedgerModule,
    LimitModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}