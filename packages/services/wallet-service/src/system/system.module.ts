import { Module } from '@nestjs/common';
import { SystemWalletsService } from './system-wallets.service';

/**
 * This module is responsible for initializing and providing system-level services
 * that need to run on application startup.
 */
@Module({
  providers: [SystemWalletsService],
  exports: [SystemWalletsService], // Optional: Export if other services need to reference it directly
})
export class SystemModule {}