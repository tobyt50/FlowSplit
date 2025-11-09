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

  const port = process.env.WALLET_SERVICE_PORT || 3102;
  await app.listen(port);

  Logger.log(
    `🚀 Wallet Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();