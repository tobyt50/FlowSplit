import { Module } from '@nestjs/common';
import { SystemWalletsService } from './system-wallets.service';

@Module({
  providers: [SystemWalletsService],
  exports: [SystemWalletsService],
})
export class SystemModule {}