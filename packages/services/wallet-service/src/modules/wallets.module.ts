import { forwardRef, Module } from '@nestjs/common';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { LedgerModule } from '../ledger/ledger.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    LedgerModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
})
export class WalletsModule {}