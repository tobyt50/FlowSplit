import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@flowsplit/prisma';
import { WalletsModule } from './modules/wallets.module';
import { AuthModule } from './auth/auth.module';
import { LoggerModule } from 'nestjs-pino';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
    WalletsModule,
    AuthModule,
    SystemModule,
  ],
})
export class AppModule {}