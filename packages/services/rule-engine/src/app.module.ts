import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@flowsplit/prisma';
import { RuleEngineController } from './rule-engine.controller';
import { RuleEngineService } from './rule-engine.service';
import { LoggerModule } from 'nestjs-pino';

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
  ],
  controllers: [RuleEngineController],
  providers: [RuleEngineService],
})
export class AppModule {}