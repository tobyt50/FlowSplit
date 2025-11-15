import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import json from 'express-json';
import { Logger } from 'nestjs-pino';
import { PrismaService } from '@flowsplit/prisma';

// CRITICAL: This patch allows BigInt values to be serialized to JSON.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });

  // --- Observability & Logging ---
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // --- Security & CORS ---
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');
  if (!frontendUrl) {
    pinoLogger.warn('FRONTEND_ORIGIN_URL is not defined; CORS will not be configured.');
  } else {
    app.enableCors({
      origin: frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
    pinoLogger.log(`CORS enabled for origin: ${frontendUrl}`);
  }

  // --- Middleware & Global Configuration ---
  app.use(json());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // --- Graceful Shutdown ---
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // --- Start Application ---
  const port = configService.get<string>('TRANSACTIONS_SERVICE_PORT') || 3103;
  await app.listen(port);

  pinoLogger.log(`🚀 Transactions Service running on: http://localhost:${port}`);
}
bootstrap();