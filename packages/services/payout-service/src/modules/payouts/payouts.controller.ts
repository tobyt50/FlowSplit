import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Logger } from '@nestjs/common';
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

@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  private readonly logger = new Logger(PayoutsController.name);

  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('initiate')
  initiatePayout(@CurrentUser() user: User, @Body() initiatePayoutDto: InitiatePayoutDto) {
    return this.payoutsService.initiate(user.id, initiatePayoutDto);
  }

  /**
   * Secure endpoint for Paystack webhooks
   */
  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(@Body() payload: PaystackWebhookDto) {
    switch (payload.event) {
      case PaystackEventType.TRANSFER_SUCCESS:
        // Cast is safe now: already validated by PaystackWebhookDto
        await this.payoutsService.handleTransferSuccess(payload as PaystackTransferSuccessDto);
        break;
      case PaystackEventType.TRANSFER_FAILED:
        await this.payoutsService.handleTransferFailed(payload as PaystackTransferFailedDto);
        break;
      default:
        this.logger.log(`Received unhandled Paystack event: ${payload.event}`);
    }
  }
}
