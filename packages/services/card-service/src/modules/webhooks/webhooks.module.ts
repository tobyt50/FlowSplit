import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhookController } from './webhook.controller';
import { AuthorizationService } from '../authorizations/authorization.service';
import { SettlementService } from '../settlement/settlement.service';
import { LedgerModule } from '../../ledger/ledger.module';
import { SystemModule } from '../../system/system.module';
import { LimitModule } from '@flowsplit/limits';

@Module({
  imports: [ConfigModule, LedgerModule, SystemModule, LimitModule],
  controllers: [WebhookController],
  providers: [AuthorizationService, SettlementService],
})
export class WebhooksModule {}