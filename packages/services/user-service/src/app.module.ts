import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@flowsplit/prisma';
import { UsersModule } from './modules/users.module';
import { KycModule } from './modules/kyc/kyc.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { HealthController } from './health.controller';
import { StorageModule } from '@flowsplit/storage';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        // Pino-pretty is used in development for human-readable logs.
        // In production, this is disabled to output raw JSON, which is optimal
        // for log ingestion services (e.g., Datadog, CloudWatch).
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        
        // Set log level based on environment. 'debug' is useful for development,
        // while 'info' is standard for production.
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    KycModule,
    StorageModule,
  ],
  controllers: [
    HealthController
  ],
  providers: [],
})
export class AppModule {}