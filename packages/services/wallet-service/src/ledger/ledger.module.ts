import { Module } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { SystemWalletsService } from '../system/system-wallets.service'; 

@Module({
  providers: [LedgerService, SystemWalletsService],
  exports: [LedgerService],
})
export class LedgerModule {}