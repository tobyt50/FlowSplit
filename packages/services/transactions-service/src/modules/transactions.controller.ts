import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import { PaystackGuard } from '../common/guards/paystack.guard';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * Dedicated, secure endpoint for receiving Paystack webhooks.
   */
  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  async handlePaystackWebhook(@Body() payload: PaystackChargeSuccessDto) {
    await this.transactionsService.processPaystackDeposit(payload);
    return { status: 'acknowledged' };
  }

  /**
   * Endpoint for users to get their transaction history.
   * Supports optional filtering by walletId.
   * GET /api/transactions?walletId=...
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @CurrentUser() user: User,
    @Query('walletId') walletId?: string // Capture the optional query param
  ) {
    return this.transactionsService.findAllForUser(user.id, walletId);
  }
}