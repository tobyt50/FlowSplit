// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@flowsplit/prisma';
import { PaystackModule } from './paystack/paystack.module';
import { AuthModule } from './auth/auth.module';
import { BankAccountsModule } from './modules/bank-accounts/bank-accounts.module';
import { PayoutsModule } from './modules/payouts/payouts.module';
import { SystemModule } from './system/system.module';
import { LedgerModule } from './ledger/ledger.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
      },
    }),
    PrismaModule,
    SystemModule, // Ensures system wallets are created on startup
    LedgerModule,
    PaystackModule,
    AuthModule,
    BankAccountsModule,
    PayoutsModule,
  ],
})
export class AppModule {}