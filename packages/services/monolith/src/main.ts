import { NestFactory } from '@nestjs/core';
import { MonolithModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';

// BigInt Patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(MonolithModule, {
    bufferLogs: true,
    rawBody: true,
  });

  app.useLogger(app.get(PinoLogger));

  const logger = new Logger('Monolith');

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');

  if (!frontendUrl) {
    logger.warn('FRONTEND_ORIGIN_URL is not defined; CORS will not be configured.');
  } else {
    app.enableCors({
      origin: frontendUrl,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      credentials: true,
    });
    logger.log(`CORS enabled for origin: ${frontendUrl}`);
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.setGlobalPrefix('api');

  // --- CONNECT ALL MICROSERVICE LISTENERS ---
  if (!rabbitmqUrl) {
    logger.error('RABBITMQ_URL is not defined! Cannot start event listeners.');
  } else {
    // Listener for the Rule Engine
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'rule_engine_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });

    // Listener for the Notification Service
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'notification_queue',
        queueOptions: { durable: true },
        noAck: false,
      },
    });
  }

  // --- START ALL CONFIGURED MICROSERVICES ---
  // This tells NestJS to start listening on the queues defined above.
  // await app.startAllMicroservices();

  const port = 4000;
  await app.listen(port);

  logger.log(`🚀 MONOLITH Backend running on: http://localhost:${port}`);
  if (rabbitmqUrl) {
    logger.log(`🐰 Listening for events on RabbitMQ`);
  }
}

bootstrap();