import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// BigInt JSON serialization patch (for Prisma or similar)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // Create app early with rawBody support
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Use NestJS ConfigService for consistent env management
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');

  if (!frontendUrl) {
    throw new Error('FRONTEND_ORIGIN_URL is not defined in environment variables.');
  }

  // Enable CORS explicitly and early
  app.enableCors({
    origin: frontendUrl,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // Global validation and request transformation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  const port = process.env.AUTH_SERVICE_PORT || 3100;
  await app.listen(port);

  Logger.log(`🚀 Auth Service running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
