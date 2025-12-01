import { Controller, Get, Post, Body, UseGuards, Query, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import { PaystackGuard } from '../common/guards/paystack.guard';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  async handlePaystackWebhook(@Body() payload: PaystackChargeSuccessDto) {
    this.transactionsService.processPaystackDeposit(payload);
    return { status: 'acknowledged' };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: User, @Query('walletId') walletId?: string) {
    return this.transactionsService.findAllForUser(user.id, walletId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionsService.findOneById(user.id, id);
  }
}