import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
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
    rawBody: true,
  });

  // --- Observability & Logging ---
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // --- Security & CORS ---
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  const adminFrontendUrl = configService.get<string>('ADMIN_FRONTEND_URL');

  const allowedOrigins = [frontendUrl, adminFrontendUrl].filter(Boolean);

  if (allowedOrigins.length === 0) {
    pinoLogger.warn('No frontend URLs defined; CORS will not be configured.');
  } else {
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });

    pinoLogger.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  }

  // --- Global Configuration ---
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // --- Graceful Shutdown ---
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // --- Start Application ---
  const port = configService.get<string>('AUTH_SERVICE_PORT') || 3100;
  await app.listen(port);

  pinoLogger.log(`🚀 Auth Service running on http://localhost:${port}`);
}

bootstrap();
