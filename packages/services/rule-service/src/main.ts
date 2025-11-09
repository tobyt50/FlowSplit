import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

// CRITICAL: This patch allows BigInt values from Prisma to be serialized to JSON.
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  const port = process.env.RULE_SERVICE_PORT || 3104;
  await app.listen(port);

  Logger.log(
    `🚀 Rule Service is running on: http://localhost:${port}`,
    'Bootstrap',
  );
}
bootstrap();