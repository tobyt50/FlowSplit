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

// Manual Mounts (Rule Engine & Dashboard)
import { RuleEngineController } from '../../rule-engine/src/rule-engine.controller';
import { RuleEngineService } from '../../rule-engine/src/rule-engine.service';
import { LedgerModule } from '../../rule-engine/src/ledger/ledger.module'; 
import { DashboardService } from '../../dashboard-service/src/modules/dashboard.service';
import { DashboardController } from '../../dashboard-service/src/modules/dashboard.controller';

// Notification Service Imports
import { NotificationsController } from '../../notification-service/src/modules/notifications/notifications.controller';
import { NotificationsService } from '../../notification-service/src/modules/notifications/notifications.service';
import { EmailService } from '../../notification-service/src/modules/email/email.service';

// Admin Service Imports
import { AdminUsersModule } from '../../admin-service/src/modules/users/admin-users.module';
import { AdminLogsModule } from '../../admin-service/src/modules/logs/admin-logs.module';
import { AuditModule } from '../../admin-service/src/audit/audit.module';
import { AlertingModule } from '../../admin-service/src/alerting/alerting.module';
import { HealthController } from './health.controller';

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

    // Admin Service Modules
    AuditModule,
    AlertingModule,
    AdminUsersModule,
    AdminLogsModule,
  ],
  controllers: [
    RuleEngineController,
    DashboardController,
    NotificationsController,
    HealthController
  ],
  providers: [
    RuleEngineService,
    DashboardService,
    NotificationsService,
    EmailService,
  ]
})
export class MonolithModule {}