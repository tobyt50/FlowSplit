import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import { PaystackGuard } from '../common/guards/paystack.guard';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * This is the dedicated, secure endpoint for receiving Paystack webhooks.
   * The PaystackGuard verifies the request's authenticity before it even hits this method.
   */
  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  async handlePaystackWebhook(@Body() payload: PaystackChargeSuccessDto) {
    // We immediately return a 200 OK to Paystack to acknowledge receipt.
    // The actual processing happens asynchronously in the service.
    this.transactionsService.processPaystackDeposit(payload);
    return { status: 'acknowledged' };
  }

  /**
   * This endpoint is for users to get their own transaction history.
   * It is protected by our JWT authentication.
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User) {
    return this.transactionsService.findAllForUser(user.id);
  }
}