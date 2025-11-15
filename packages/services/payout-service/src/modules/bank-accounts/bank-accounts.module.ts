import { Module } from '@nestjs/common';
import { BankAccountsController } from './bank-accounts.controller';
import { BankAccountsService } from './bank-accounts.service';
import { PaystackModule } from '../../paystack/paystack.module'; // Import the module providing PaystackService

@Module({
  imports: [
    PaystackModule, // Make PaystackService available for injection
  ],
  controllers: [BankAccountsController],
  providers: [BankAccountsService],
})
export class BankAccountsModule {}