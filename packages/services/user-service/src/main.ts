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
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global validation and request transformation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Global prefix for API routes
  app.setGlobalPrefix('api');

  // Listen on the configured port
  const port = process.env.USER_SERVICE_PORT || 3101;
  await app.listen(port);

  Logger.log(
    `🚀 User Service running on: http://localhost:${port}`,
    'Bootstrap',
  );
}

bootstrap();
