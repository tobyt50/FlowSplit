import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';
import { LimitModule, LIMIT_NOTIFIER } from '@flowsplit/limits';
import { RabbitLimitNotifier } from './limits/limit-notifier.adapter';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { RateLimitModule } from '@flowsplit/security';

// Feature Modules
import { AuthModule } from '../../auth/src/auth/auth.module';
import { UsersModule } from '../../user-service/src/modules/users.module';
import { WalletsModule } from '../../wallet-service/src/modules/wallets.module';
import { CardServiceModule } from '../../card-service/src/card-service.module';
import { KycModule } from '../../user-service/src/modules/kyc/kyc.module';
import { TransactionsModule } from '../../transactions-service/src/modules/transactions.module';
import { RulesModule } from '../../rule-service/src/modules/rules.module';
import { PayoutsModule } from '../../payout-service/src/modules/payouts/payouts.module';
import { BankAccountsModule } from '../../payout-service/src/modules/bank-accounts/bank-accounts.module';
import { SystemModule } from '../../payout-service/src/system/system.module';
import { AppLimitsModule } from '../../dashboard-service/src/modules/limits/limits.module';
import { SearchModule } from '../../dashboard-service/src/modules/search/search.module';

// Manual Mounts (Rule Engine & Dashboard)
import { RuleEngineController } from '../../rule-engine/src/rule-engine.controller';
import { RuleEngineService } from '../../rule-engine/src/rule-engine.service';
import { LedgerModule } from '../../rule-engine/src/ledger/ledger.module'; 
import { DashboardService } from '../../dashboard-service/src/modules/dashboard/dashboard.service';
import { DashboardController } from '../../dashboard-service/src/modules/dashboard/dashboard.controller';

// Notification Service Imports
import { NotificationsController } from '../../notification-service/src/modules/notifications/notifications.controller';
import { NotificationsService } from '../../notification-service/src/modules/notifications/notifications.service';
import { EmailService } from '../../notification-service/src/modules/email/email.service';

// Admin Service Imports
import { AdminUsersModule } from '../../admin-service/src/modules/users/admin-users.module';
import { AdminLogsModule } from '../../admin-service/src/modules/logs/admin-logs.module';
import { AdminMetricsModule } from '../../admin-service/src/modules/metrics/admin-metrics.module';
import { AuditModule } from '../../admin-service/src/audit/audit.module';
import { AlertingModule } from '../../admin-service/src/alerting/alerting.module';
import { AdminKycModule } from '../../admin-service/src/modules/kyc/admin-kyc.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ 
      isGlobal: true,
      envFilePath: '../../../.env' 
    }),
    LoggerModule.forRoot({ pinoHttp: { transport: { target: 'pino-pretty' } } }),
    PrismaModule,
    RateLimitModule,

    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        useFactory: (config: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [config.get<string>('RABBITMQ_URL')],
            queue: 'notification_queue',
            queueOptions: { durable: true },
          },
        }),
        inject: [ConfigService],
      },
    ]),
    
    // Feature Modules
    AuthModule,
    LimitModule,
    AppLimitsModule,
    UsersModule,
    WalletsModule,
    CardServiceModule,
    TransactionsModule,
    KycModule,
    RulesModule,
    PayoutsModule,
    BankAccountsModule,
    SystemModule, 
    LedgerModule,
    SearchModule,

    // Admin Service Modules
    AuditModule,
    AlertingModule,
    AdminMetricsModule,
    AdminUsersModule,
    AdminLogsModule,
    AdminKycModule,
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
    {
      provide: LIMIT_NOTIFIER,
      useClass: RabbitLimitNotifier,
    }
  ]
})
export class MonolithModule {}