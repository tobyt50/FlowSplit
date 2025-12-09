import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaService } from '@flowsplit/prisma';
import { CardsController } from './cards.controller';
import { StripeIssuingService } from '../../providers/stripe/stripe-issuing.service';
import { MockIssuingService } from '../../providers/stripe/mock-issuing.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [CardsController],
  providers: [
    // Register the classes so Nest handles their dependencies if needed
    StripeIssuingService,
    MockIssuingService, 
    
    // THE DYNAMIC SWITCH
    {
      provide: 'CARD_ISSUER',
      useFactory: (config: ConfigService, prisma: PrismaService) => {
        const useMock = config.get<string>('USE_MOCK_CARDS') === 'true';
        
        if (useMock) {
          console.log('🔶 CARD SERVICE: Using MOCK Provider');
          return new MockIssuingService();
        } else {
          console.log('🟢 CARD SERVICE: Using LIVE STRIPE Provider');
          return new StripeIssuingService(config, prisma);
        }
      },
      inject: [ConfigService, PrismaService], // Inject dependencies needed by the real service
    },
  ],
})
export class CardsModule {}