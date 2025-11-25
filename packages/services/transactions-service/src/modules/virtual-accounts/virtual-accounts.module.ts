import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VirtualAccountsService } from './virtual-accounts.service';
import { VirtualAccountsController } from './virtual-accounts.controller';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [
    ConfigModule, 
    AuthModule
  ],
  controllers: [VirtualAccountsController],
  providers: [VirtualAccountsService],
  exports: [VirtualAccountsService],
})
export class VirtualAccountsModule {}