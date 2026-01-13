import { NestFactory } from '@nestjs/core';
import { MonolithModule } from './app.module';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';
import { PrismaService } from '@flowsplit/prisma';

// BigInt JSON Serialization Patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(MonolithModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useLogger(app.get(PinoLogger));
  const logger = new Logger('MonolithBootstrap');
  const configService = app.get(ConfigService);

  const frontendUrl = configService.get<string>('FRONTEND_URL'); // e.g. https://flowsplit.vercel.app
  const adminUrl = configService.get<string>('ADMIN_FRONTEND_URL'); // e.g. https://admin.flowsplit.vercel.app

  const allowedOrigins = [
    'http://localhost:3000', // Local Web
    'http://localhost:3001', // Local Admin
  ];

  if (frontendUrl) allowedOrigins.push(frontendUrl);
  if (adminUrl) allowedOrigins.push(adminUrl);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  logger.log(`CORS Enabled for: ${allowedOrigins.join(', ')}`);

  // URI Versioning (e.g., /api/v1/auth/login)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // Default to v1 if not specified
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.setGlobalPrefix('api');

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  if (rabbitmqUrl) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'rule_engine_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'notification_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });

    // await app.startAllMicroservices();
    logger.log(`🐰 RabbitMQ Microservices connected and listening`);
  } else {
    logger.warn(`⚠️ RABBITMQ_URL not found. Event-driven features will NOT work.`);
  }

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 MONOLITH Backend running on: ${await app.getUrl()}`);
}
bootstrap();