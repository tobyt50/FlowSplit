import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger, All } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { PayoutsService } from './payouts.service';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';
import {
  PaystackWebhookDto,
  PaystackTransferSuccessDto,
  PaystackTransferFailedDto,
  PaystackEventType,
} from './dto/paystack-webhook.dto';
import { PaystackGuard } from '../../common/guards/paystack.guard';
import { FinancialThrottlerGuard, Throttle } from '@flowsplit/security';

@Controller({ path: 'payouts', version: '1' })
export class PayoutsController {
  private readonly logger = new Logger(PayoutsController.name);

  constructor(private readonly payoutsService: PayoutsService) {}

  /**
   * Endpoint for an authenticated user to initiate a payout.
   * This route is protected and requires a user's JWT.
   */
  @Post('initiate')
  @UseGuards(JwtAuthGuard)
  @UseGuards(FinancialThrottlerGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 3. Limit: 10 payouts per minute
  initiatePayout(@CurrentUser() user: User, @Body() initiatePayoutDto: InitiatePayoutDto) {
    return this.payoutsService.initiate(user.id, initiatePayoutDto);
  }

  /**
   * Secure public endpoint for receiving webhooks from Paystack.
   * This route is NOT protected by a JWT.
   * Instead, it is protected by the PaystackGuard, which verifies the x-paystack-signature.
   */
  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(@Body() payload: PaystackWebhookDto) {
    switch (payload.event) {
      case PaystackEventType.TRANSFER_SUCCESS:
        await this.payoutsService.handleTransferSuccess(payload as unknown as PaystackTransferSuccessDto);
        break;
      case PaystackEventType.TRANSFER_FAILED:
        await this.payoutsService.handleTransferFailed(payload as unknown as PaystackTransferFailedDto);
        break;
      default:
        this.logger.log(`Received unhandled Paystack event: ${payload.event}`);
    }
  }
  
  /**
    * Catch-all for any other webhook events that we don't explicitly handle.
    * This prevents logging errors for events we don't care about, like 'transfer.reversed'.
    */
  @All('webhooks/paystack')
  @HttpCode(HttpStatus.OK)
  handleOtherPaystackEvents() {
    this.logger.log('Received a Paystack webhook event that is not transfer.success or transfer.failed. Acknowledged and ignored.');
    return;
  }
}