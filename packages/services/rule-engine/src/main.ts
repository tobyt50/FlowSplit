import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '@flowsplit/prisma';

// CRITICAL: This patch allows BigInt values to be serialized to JSON.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  // --- Observability & Logging ---
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // --- Graceful Shutdown ---
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // --- Microservice Configuration ---
  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
  if (!rabbitmqUrl) {
    pinoLogger.error('RABBITMQ_URL is not defined in the environment variables. Shutting down.');
    await app.close();
    process.exit(1);
  }
  
  // Connect the configured Nest application to the microservice transport layer.
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: 'rule_engine_queue',
      queueOptions: {
        durable: true,
      },
      noAck: false,
    },
  });

  // --- Start Microservice ---
  await app.startAllMicroservices();
  
  pinoLogger.log('🚀 Rule Engine is listening for events');
}
bootstrap();