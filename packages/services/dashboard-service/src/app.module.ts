import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { HealthController } from './health.controller';
import { LimitModule } from '@flowsplit/limits';
import { AppLimitsModule } from './modules/limits/limits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
      },
    }),
    PrismaModule,
    AuthModule,
    DashboardModule,
    LimitModule,
    AppLimitsModule,
  ],
  controllers: [
    HealthController,
  ]
})
export class AppModule {}