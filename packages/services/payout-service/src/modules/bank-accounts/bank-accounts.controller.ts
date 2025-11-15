import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { BankAccountsService } from './bank-accounts.service';
import { AddBankAccountDto } from './dto/add-bank-account.dto';

@Controller('bank-accounts')
@UseGuards(JwtAuthGuard) // Protect all routes in this controller
export class BankAccountsController {
  constructor(private readonly bankAccountsService: BankAccountsService) {}

  /**
   * Endpoint for a user to add a new external bank account.
   * It triggers a verification process with the payment provider.
   */
  @Post()
  addBankAccount(
    @CurrentUser() user: User,
    @Body() addBankAccountDto: AddBankAccountDto,
  ) {
    return this.bankAccountsService.addAndVerifyAccount(user.id, addBankAccountDto);
  }

  /**
   * Endpoint for a user to retrieve their list of linked bank accounts.
   */
  @Get()
  getBankAccounts(@CurrentUser() user: User) {
    return this.bankAccountsService.getAccountsForUser(user.id);
  }
}