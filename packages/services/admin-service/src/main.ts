import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { ConfigService } from '@nestjs/config';

// --- Sentry Init ---
const configService = new ConfigService();
Sentry.init({
  dsn: configService.get<string>('SENTRY_DSN_ADMIN_SERVICE'),
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: configService.get<string>('NODE_ENV') || 'development',
});

// BigInt JSON serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const frontendUrl = configService.get<string>('ADMIN_FRONTEND_URL');
  if (!frontendUrl) {
    logger.warn('ADMIN_FRONTEND_URL is not defined; CORS will not be configured.');
  } else {
    app.enableCors({
      origin: frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
    logger.log(`CORS enabled for origin: ${frontendUrl}`);
  }

  // URI Versioning (e.g., /api/v1/auth/login)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Default to v1 if not specified
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.setGlobalPrefix('api');

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = configService.get<number>('ADMIN_SERVICE_PORT') || 3109;
  await app.listen(port);

  logger.log(`🚀 Admin Service is running on: http://localhost:${port}`);
}

bootstrap();
