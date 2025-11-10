import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// BigInt JSON serialization patch (for Prisma or similar)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // Create app early with rawBody support for webhooks or payments
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Use ConfigService for consistent environment configuration
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

  // Global validation and DTO transformation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global API prefix
  app.setGlobalPrefix('api');

  // Listen on configured port
  const port = process.env.WALLET_SERVICE_PORT || 3102;
  await app.listen(port);

  Logger.log(
    `🚀 Wallet Service running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap();
