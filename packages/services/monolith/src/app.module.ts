import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';

// Feature Modules
import { AuthModule } from '../../auth/src/auth/auth.module';
import { UsersModule } from '../../user-service/src/modules/users.module';
import { WalletsModule } from '../../wallet-service/src/modules/wallets.module';
import { TransactionsModule } from '../../transactions-service/src/modules/transactions.module';
import { RulesModule } from '../../rule-service/src/modules/rules.module';
import { PayoutsModule } from '../../payout-service/src/modules/payouts/payouts.module';
import { BankAccountsModule } from '../../payout-service/src/modules/bank-accounts/bank-accounts.module';
import { SystemModule } from '../../payout-service/src/system/system.module';
import { RuleEngineController } from '../../rule-engine/src/rule-engine.controller';
import { RuleEngineService } from '../../rule-engine/src/rule-engine.service';
import { LedgerModule } from '../../rule-engine/src/ledger/ledger.module'; 
import { DashboardService } from '../../dashboard-service/src/modules/dashboard.service';
import { DashboardController } from '../../dashboard-service/src/modules/dashboard.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '../../../.env' 
    }),
    LoggerModule.forRoot({ pinoHttp: { transport: { target: 'pino-pretty' } } }),
    PrismaModule,
    
    // Feature Modules
    AuthModule,
    UsersModule,
    WalletsModule,
    TransactionsModule,
    RulesModule,
    PayoutsModule,
    BankAccountsModule,
    SystemModule, 
    LedgerModule, 
  ],
  controllers: [
    RuleEngineController,
    DashboardController
  ],
  providers: [
    RuleEngineService,
    DashboardService
  ]
})
export class MonolithModule {}