import { forwardRef, Module } from '@nestjs/common';
import { PayoutsController } from './payouts.controller';
import { PayoutsService } from './payouts.service';
import { PaystackModule } from '../../paystack/paystack.module';
import { LedgerModule } from '../../ledger/ledger.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { LimitModule } from '@flowsplit/limits';

@Module({
  imports: [
    PaystackModule,
    LedgerModule,
    LimitModule,
    ClientsModule.registerAsync([
      {
        name: 'NOTIFICATION_SERVICE',
        useFactory: (configService: ConfigService) => {
          const rmqUrl = configService.get<string>('RABBITMQ_URL');

          if (!rmqUrl) {
            throw new Error('RABBITMQ_URL is not defined in the environment variables.');
          }

          return {
            transport: Transport.RMQ,
            options: {
              urls: [rmqUrl],
              queue: 'notification_queue',
              queueOptions: {
                durable: true,
              },
            },
          };
        },
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PayoutsController],
  providers: [PayoutsService],
})
export class PayoutsModule {}