import { Controller, Get, UseGuards } from '@nestjs/common';
import { VirtualAccountsService } from './virtual-accounts.service';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class VirtualAccountsController {
  constructor(private readonly virtualAccountsService: VirtualAccountsService) {}

  /**
   * GET /api/transactions/virtual-account
   * Retrieves or provisions the dedicated virtual account for the logged-in user.
   */
  @Get('virtual-account')
  async getVirtualAccount(@CurrentUser() user: User) {
    return this.virtualAccountsService.getOrCreateVirtualAccount(user.id);
  }
}