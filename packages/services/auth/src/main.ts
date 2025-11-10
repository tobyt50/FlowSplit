import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');
  if (!frontendUrl) {
    throw new Error('FRONTEND_ORIGIN_URL is not defined in the environment variables.');
  }

  // Apply CORS immediately and explicitly
  app.enableCors({
    origin: frontendUrl,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.AUTH_SERVICE_PORT || 3100;
  await app.listen(port);

  Logger.log(`🚀 Auth Service running on http://localhost:${port}`, 'Bootstrap');
}
bootstrap();
