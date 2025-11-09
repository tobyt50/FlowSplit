import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const tempApp = await NestFactory.createApplicationContext(AppModule);
  const configService = tempApp.get(ConfigService);
  await tempApp.close();

  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL');
  if (!rabbitmqUrl) {
    throw new Error('RABBITMQ_URL is not defined in the environment variables.');
  }

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: 'rule_engine_queue',
        queueOptions: {
          durable: true,
        },
        noAck: false,
      },
    },
  );

  await app.listen();
  Logger.log('🚀 Rule Engine is listening for events', 'Bootstrap');
}
bootstrap();