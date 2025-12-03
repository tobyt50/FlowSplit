import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';
import { AuthModule } from './auth/auth.module';
import { AlertingModule } from './alerting/alerting.module';
import { AuditModule } from './audit/audit.module';
import { AdminUsersModule } from './modules/users/admin-users.module';
import { AdminLogsModule } from './modules/logs/admin-logs.module';
import { AdminMetricsModule } from './modules/metrics/admin-metrics.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    AlertingModule,
    AuditModule,
    AdminUsersModule,
    AdminLogsModule,
    AdminMetricsModule,
  ],
    controllers: [
      HealthController
    ]
})
export class AppModule {}