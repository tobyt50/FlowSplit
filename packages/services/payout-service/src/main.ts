process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! UNHANDLED REJECTION !!!');
  console.error('Reason:', reason);
  console.error('Promise:', promise);
  // You can add process.exit(1) here if you want it to crash with a clear error
});

process.on('uncaughtException', (error) => {
  console.error('!!! UNCAUGHT EXCEPTION !!!');
  console.error('Error:', error);
  process.exit(1); // Force exit with a failure code
});

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
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
  app.useLogger(app.get(Logger));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.setGlobalPrefix('api');

  // Graceful shutdown hooks
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const port = process.env.PAYOUT_SERVICE_PORT || 3105;
  await app.listen(port);
  
  const logger = app.get(Logger);
  logger.log(`🚀 Payout Service is running on: http://localhost:${port}`);
}
bootstrap();