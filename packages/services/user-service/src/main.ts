import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// This patch allows BigInt values to be serialized to JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.USER_SERVICE_PORT || 3101;
  await app.listen(port);

  Logger.log(
    `🚀 User Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();