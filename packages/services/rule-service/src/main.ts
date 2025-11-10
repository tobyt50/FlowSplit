import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Allow Prisma BigInt serialization
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // Create app with rawBody support for any payment/webhook integrations
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');

  if (!frontendUrl) {
    throw new Error('FRONTEND_ORIGIN_URL is not defined in environment variables.');
  }

  // Explicitly enable CORS early
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Global DTO validation and prefix setup
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.RULE_SERVICE_PORT || 3104;
  await app.listen(port);

  Logger.log(`🚀 Rule Service running on: http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
