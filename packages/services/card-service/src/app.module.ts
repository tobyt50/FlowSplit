import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';

// Domain Modules
import { CardsModule } from './modules/cards/cards.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { SystemModule } from './system/system.module';
import { LedgerModule } from './ledger/ledger.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // 1. Configuration
    ConfigModule.forRoot({ 
      isGlobal: true,
    }),

    // 2. Logging (Pino)
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? { target: 'pino-pretty' }
            : undefined,
        // Exclude health checks or simple gets from logs if desired
        // autoLogging: {
        //   ignore: (req) => req.url.includes('/health'),
        // },
      },
    }),

    // 3. Database
    PrismaModule,

    // 4. Feature Modules
    SystemModule,   // Ensures system wallets exist on startup
    LedgerModule,   // Provides local ledger logic
    AuthModule,     // Provides JWT Guards
    CardsModule,    // Handles Card Issuance API
    WebhooksModule, // Handles Stripe Webhooks
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}