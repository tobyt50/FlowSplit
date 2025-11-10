import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import json from 'express-json';
import { ConfigService } from '@nestjs/config';

// Allow BigInt serialization (for Prisma or similar)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // Create the app early with rawBody support for webhooks or payment guards
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Use Nest’s configuration service for reliability and testability
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');

  if (!frontendUrl) {
    throw new Error('FRONTEND_ORIGIN_URL is not defined in environment variables.');
  }

  // Enable CORS explicitly and early
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Attach Express JSON parser
  app.use(json());

  // Global validation and request transformation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for routes
  app.setGlobalPrefix('api');

  // Listen on configured port
  const port = process.env.TRANSACTIONS_SERVICE_PORT || 3103;
  await app.listen(port);

  Logger.log(
    `🚀 Transactions Service running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap();
