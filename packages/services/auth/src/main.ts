import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipes for DTOs
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Set a global prefix for all routes (e.g., /api/auth/*)
  app.setGlobalPrefix('api');
  
  const port = process.env.AUTH_SERVICE_PORT || 3100;
  await app.listen(port);
  
  Logger.log(
    `🚀 Auth Service is running on: http://localhost:${port}`,
    'Bootstrap'
  );
}
bootstrap();