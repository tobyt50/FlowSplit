import { NestFactory } from '@nestjs/core';
import { MonolithModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { Logger as PinoLogger } from 'nestjs-pino';

// BigInt Patch
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const app = await NestFactory.create(MonolithModule, {
    bufferLogs: false,
    rawBody: true,
  });

  app.useLogger(app.get(PinoLogger));

  const logger = new Logger('Monolith');

  const configService = app.get(ConfigService);
  const frontendUrl = configService.get<string>('FRONTEND_ORIGIN_URL');

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

  // --- Connect to RabbitMQ (Disabled for Local Monolith) ---
  //   app.connectMicroservice({
  //     transport: Transport.RMQ,
  //     options: {
  //       urls: [process.env.RABBITMQ_URL],
  //       queue: 'rule_engine_queue',
  //       queueOptions: { durable: true },
  //       noAck: false,
  //     },
  //   });

  // Disabled because we are not using microservices transport right now
  // await app.startAllMicroservices();

  const port = 4000;
  await app.listen(port);

  logger.log(`🚀 MONOLITH Backend running on: http://localhost:${port}`);
}

bootstrap();