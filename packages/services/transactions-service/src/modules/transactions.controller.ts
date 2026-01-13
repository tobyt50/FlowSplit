import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus, Param, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { VirtualAccountsService } from './virtual-accounts/virtual-accounts.service';
import { PaystackChargeSuccessDto } from './dto/paystack-charge-success.dto';
import { PaystackGuard } from '../common/guards/paystack.guard';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller({ path: 'transactions', version: '1' })
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly virtualAccountsService: VirtualAccountsService,
  ) {}

  /**
   * GET /api/transactions
   * Retrieves transaction history for the logged-in user.
   * - If no walletId is provided: Returns the Unified History (Cards + Wallets).
   * - If walletId is provided: Returns transactions specific to that wallet.
   */
  @Get()
  findAll(@CurrentUser() user: User, @Query('walletId') walletId?: string) {
    if (walletId) {
      return this.transactionsService.findAllForUser(user.id, walletId);
    }
    return this.transactionsService.getUnifiedHistory(user.id);
  }

  /**
   * GET /api/transactions/virtual-account
   * Retrieves or provisions the dedicated virtual account for the logged-in user.
   */
  @Get('virtual-account')
  async getVirtualAccount(@CurrentUser() user: User) {
    return this.virtualAccountsService.getOrCreateVirtualAccount(user.id);
  }

  /**
   * GET /api/transactions/:id
   * Retrieves a single transaction by its ID. Must be last among GET routes.
   */
  @Get(':id')
  async findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.transactionsService.findOneById(user.id, id);
  }

  /**
   * POST /api/transactions/webhooks/paystack
   * Secure endpoint for receiving Paystack webhooks.
   */
  @Post('webhooks/paystack')
  @UseGuards(PaystackGuard)
  @HttpCode(HttpStatus.OK)
  async handlePaystackWebhook(@Body() payload: any) {
    if (payload.event === 'charge.success') {
      await this.transactionsService.processPaystackDeposit(payload as PaystackChargeSuccessDto);
    }
    return;
  }
}