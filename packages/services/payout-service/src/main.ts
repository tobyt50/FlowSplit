import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@flowsplit/prisma';
import { ConfigService } from '@nestjs/config';

// BigInt JSON serialization patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // For webhook verification
  });

  // Logging, validation, and prefix setup
  const logger = app.get(PinoLogger);
  app.useLogger(logger);

  // URI Versioning (e.g., /api/v1/auth/login)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Default to v1 if not specified
  });
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  // --- CORS Setup ---
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_URL');
  if (!frontendUrl) {
    logger.warn('FRONTEND_URL is not defined; CORS will not be configured.');
  } else {
    app.enableCors({
      origin: frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
    logger.log(`CORS enabled for origin: ${frontendUrl}`);
  }

  // Graceful shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PAYOUT_SERVICE_PORT || 3105;
  await app.listen(port);

  logger.log(`🚀 Payout Service is running on: http://localhost:${port}`);
}
bootstrap();
