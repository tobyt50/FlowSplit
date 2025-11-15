import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger as PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@flowsplit/prisma';

// BigInt JSON serialization patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    rawBody: true, // For webhook verification
  });

  // Logging, validation, and prefix setup
  app.useLogger(app.get(PinoLogger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  // Graceful shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PAYOUT_SERVICE_PORT || 3105;
  await app.listen(port);
  
  const logger = app.get(PinoLogger);
  logger.log(`🚀 Payout Service is running on: http://localhost:${port}`);
}
bootstrap();