import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import json from 'express-json';

// This patch allows BigInt values to be serialized to JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  app.use(json());

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.TRANSACTIONS_SERVICE_PORT || 3103;
  await app.listen(port);

  Logger.log(
    `🚀 Transactions Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();