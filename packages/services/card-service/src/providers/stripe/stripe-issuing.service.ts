import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService, User, Wallet } from '@flowsplit/prisma';

@Injectable()
export class StripeIssuingService {
  private readonly logger = new Logger(StripeIssuingService.name);
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService
  ) {
    const secretKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      this.logger.error('FATAL: STRIPE_SECRET_KEY is missing from environment variables.');
      throw new Error('FATAL: STRIPE_SECRET_KEY is not configured.');
    }
    this.logger.log('Initializing Stripe Client...');
    this.stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
      typescript: true,
    });
    this.logger.log('Stripe Client Initialized.');
  }

  /**
   * Issues a new virtual card on Stripe linked to a Cardholder.
   */
  async createVirtualCard(user: User, wallet: Wallet, nameOnCard: string) {
    this.logger.log(`[createVirtualCard] START - User: ${user.id}, Wallet: ${wallet.id}, Name: ${nameOnCard}`);
    this.logger.debug(`[createVirtualCard] Wallet Details - Currency: ${wallet.currency}, Balance: ${wallet.balance}`);

    try {
      this.logger.log(`[createVirtualCard] Step 1: retrieving or creating cardholder...`);
      const cardholderId = await this.getOrCreateCardholder(user);
      this.logger.log(`[createVirtualCard] Step 1 COMPLETE. Using Cardholder ID: ${cardholderId}`);

      this.logger.log(`[createVirtualCard] Step 2: Calling Stripe API to issue card...`);
      
      const cardPayload: Stripe.Issuing.CardCreateParams = {
        cardholder: cardholderId,
        currency: 'usd',
        type: 'virtual',
        status: 'active',
        metadata: {
          flowsplit_user_id: user.id,
          flowsplit_wallet_id: wallet.id,
        },
      };

      this.logger.debug(`[createVirtualCard] Stripe Payload: ${JSON.stringify(cardPayload)}`);

      const card = await this.stripe.issuing.cards.create(cardPayload);
      
      this.logger.log(`[createVirtualCard] Step 2 COMPLETE. Stripe returned Card ID: ${card.id}`);
      this.logger.debug(`[createVirtualCard] Stripe Response: ${JSON.stringify(card)}`);

      return {
        providerCardId: card.id,
        last4: card.last4,
        brand: card.brand,
        expiryMonth: card.exp_month,
        expiryYear: card.exp_year,
        cvc: '', 
      };

    } catch (error: any) {
      this.logger.error(`[createVirtualCard] FAILED.`);
      
      // LOG THE RAW STRIPE ERROR FOR DEBUGGING
      if (error.raw) {
         this.logger.error(`[STRIPE RAW ERROR]: Type: ${error.type}, Code: ${error.raw.code}, Param: ${error.raw.param}, Message: ${error.raw.message}`);
         this.logger.error(`[STRIPE RAW DETAILS]: ${JSON.stringify(error.raw, null, 2)}`);
      } else {
         this.logger.error(`[UNKNOWN ERROR]: ${error.message}`, error.stack);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(`Failed to issue virtual card: ${error.message}`);
    }
  }

  /**
   * Updates the status of a virtual card on Stripe.
   */
  async updateCardStatus(providerCardId: string, status: 'active' | 'inactive') {
    this.logger.log(`[updateCardStatus] START - Card: ${providerCardId}, New Status: ${status}`);
    try {
      await this.stripe.issuing.cards.update(providerCardId, {
        status: status,
      });
      this.logger.log(`[updateCardStatus] SUCCESS - Card ${providerCardId} updated.`);
    } catch (error: any) {
      this.logger.error(`[updateCardStatus] FAILED for ${providerCardId}.`);
      if (error.raw) {
          this.logger.error(`[STRIPE RAW ERROR]: ${JSON.stringify(error.raw, null, 2)}`);
      }
      throw new InternalServerErrorException('Could not update card status with the provider.');
    }
  }

  /**
   * Permanently cancels a card on Stripe.
   */
  async cancelCard(providerCardId: string) {
    this.logger.log(`[cancelCard] START - Card: ${providerCardId}`);
    try {
      await this.stripe.issuing.cards.update(providerCardId, {
        status: 'canceled',
      });
      this.logger.log(`[cancelCard] SUCCESS - Card ${providerCardId} CANCELED.`);
    } catch (error: any) {
      this.logger.error(`[cancelCard] FAILED for ${providerCardId}.`);
       if (error.raw) {
          this.logger.error(`[STRIPE RAW ERROR]: ${JSON.stringify(error.raw, null, 2)}`);
      }
      throw new InternalServerErrorException('Could not cancel card with the provider.');
    }
  }
  
  /**
   * Idempotently gets or creates a Stripe Cardholder.
   */
  private async getOrCreateCardholder(user: User): Promise<string> {
    this.logger.log(`[getOrCreateCardholder] START - User: ${user.id}`);

    if (user.stripeCardholderId) {
      this.logger.log(`[getOrCreateCardholder] Found existing ID in DB: ${user.stripeCardholderId}`);
      return user.stripeCardholderId;
    }

    this.logger.log(`[getOrCreateCardholder] No ID found. Validating KYC data...`);
    this.logger.debug(`[getOrCreateCardholder] KYC Data: Addr1=${user.addressLine1}, City=${user.city}, Country=${user.country}, Phone=${user.phone}`);

    if (!user.addressLine1 || !user.city || !user.country || !user.phone || !user.postalCode) {
      this.logger.warn(`[getOrCreateCardholder] VALIDATION FAILED: Missing KYC data.`);
      throw new BadRequestException(
        'A billing address and phone number are required to issue a virtual card. Please update your profile settings.'
      );
    }

    try {
      this.logger.log(`[getOrCreateCardholder] Creating new Cardholder in Stripe...`);
      
      const cardholderPayload: Stripe.Issuing.CardholderCreateParams = {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone_number: user.phone,
        status: 'active',
        type: 'individual',
        billing: {
          address: {
            line1: user.addressLine1,
            city: user.city,
            state: user.state || undefined,
            postal_code: user.postalCode,
            country: user.country,
          },
        },
        metadata: {
          flowsplit_user_id: user.id,
        },
      };

      this.logger.debug(`[getOrCreateCardholder] Stripe Payload: ${JSON.stringify(cardholderPayload)}`);

      const cardholder = await this.stripe.issuing.cardholders.create(cardholderPayload);

      this.logger.log(`[getOrCreateCardholder] Stripe Creation SUCCESS. ID: ${cardholder.id}`);

      this.logger.log(`[getOrCreateCardholder] Saving ID to database...`);
      await this.prisma.user.update({
        where: { id: user.id },
        data: { stripeCardholderId: cardholder.id },
      });
      this.logger.log(`[getOrCreateCardholder] DB Update SUCCESS.`);

      return cardholder.id;

    } catch (error: any) {
      this.logger.error(`[getOrCreateCardholder] FAILED.`);
      if (error.raw) {
          this.logger.error(`[STRIPE RAW ERROR]: Code: ${error.raw.code}, Message: ${error.raw.message}`);
          this.logger.error(`[STRIPE RAW DETAILS]: ${JSON.stringify(error.raw, null, 2)}`);
      } else {
          this.logger.error(error);
      }
      
      const stripeErrorMessage = error.response?.data?.error?.message || error.message;
      throw new InternalServerErrorException(`Card issuance provider error: ${stripeErrorMessage}`);
    }
  }
}