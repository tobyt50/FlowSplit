import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@flowsplit/prisma';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';

// Allow BigInt → JSON
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // allow logs early during bootstrap
  });

  // -----------------------
  // Logging (same as Wallet)
  // -----------------------
  const pinoLogger = app.get(Logger);
  app.useLogger(pinoLogger);

  // -----------------------
  // Config & CORS
  // -----------------------
  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');

  if (!frontendUrl) {
    pinoLogger.warn(
      'FRONTEND_ORIGIN_URL is not defined; CORS will not be configured.',
    );
  } else {
    app.enableCors({
      origin: frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
    pinoLogger.log(`CORS enabled for origin: ${frontendUrl}`);
  }

  // -----------------------
  // Microservice (RabbitMQ)
  // -----------------------
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL || 'amqp://localhost:5672'],
      queue: 'notification_queue',
      queueOptions: { durable: true },
      noAck: false,
    },
  });

  // -----------------------
  // Global Middleware
  // -----------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );
  app.setGlobalPrefix('api');

  // -----------------------
  // Graceful Shutdown
  // -----------------------
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // -----------------------
  // Start Services
  // -----------------------
  // await app.startAllMicroservices();

  const port =
    configService.get<string>('NOTIFICATION_SERVICE_PORT') || 3108;
  await app.listen(port);

  pinoLogger.log(
    `🚀 Notification Service running at http://localhost:${port}`,
  );
  pinoLogger.log(
    `📧 Listening for events on RabbitMQ queue: notification_queue`,
  );
}

bootstrap();
