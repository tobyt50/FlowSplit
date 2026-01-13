import { Controller, Post, Headers, Req, BadRequestException, RawBodyRequest, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import Stripe from 'stripe';
import { AuthorizationService } from '../authorizations/authorization.service';
import { SettlementService } from '../settlement/settlement.service';

@Controller({ path: 'cards/webhooks', version: '1' })
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);
  private stripe: Stripe;
  private webhookSecret: string;
  private useMock: boolean;

  constructor(
    private config: ConfigService,
    private authService: AuthorizationService,
    private settlementService: SettlementService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' });
    this.webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET')!;
    // Check configuration flag in env
    this.useMock = this.config.get<string>('USE_MOCK_CARDS') === 'true';
  }

  @Post('stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() request: RawBodyRequest<Request>,
  ) {
    let event: Stripe.Event;

    try {
      if (this.useMock) {
        // --- MOCK MODE: Bypass Signature ---
        this.logger.warn(`🔶 MOCK MODE: Skipping Stripe Signature Verification.`);
        // We expect raw JSON in the body for Postman tests
        event = request.body as Stripe.Event;
        
        // If body parsing failed or isn't object, try parsing rawBody
        if (!event || !event.type) {
             event = JSON.parse(request.rawBody!.toString());
        }
      } else {
        // --- REAL MODE: Enforce Signature ---
        if (!signature) throw new Error('Missing stripe-signature header');
        
        event = this.stripe.webhooks.constructEvent(
          request.rawBody!,
          signature,
          this.webhookSecret
        );
      }
    } catch (err: any) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    this.logger.log(`Received Stripe Webhook Event: ${event.type}`);

    switch (event.type) {
      case 'issuing_authorization.request': {
        const auth = event.data.object as Stripe.Issuing.Authorization;
        
        // Handle mock data structure safety
        const merchantName = auth.merchant_data?.name || 'Unknown Merchant';
        const cardId = auth.card.id;

        const result = await this.authService.handleAuthorizationRequest(
          auth.id,
          BigInt(auth.amount),
          merchantName,
          cardId
        );
        
        return {
            approved: result.approved,
            metadata: { reason: result.reason }
        };
      }

      case 'issuing_transaction.created': {
        const transaction = event.data.object as Stripe.Issuing.Transaction;
        await this.settlementService.settleTransaction(transaction);
        return { received: true };
      }

      default:
        // this.logger.log(`Unhandled event type: ${event.type}`);
        return { received: true };
    }
  }
}