import { Injectable, Logger, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService, Provider } from '@flowsplit/prisma';
import { PaystackService } from '../../paystack/paystack.service';
import { AddBankAccountDto } from './dto/add-bank-account.dto';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class BankAccountsService {
  private readonly logger = new Logger(BankAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paystackService: PaystackService,
  ) {}

  async addAndVerifyAccount(userId: string, data: AddBankAccountDto) {
    const { accountNumber, bankCode } = data;

    const existingAccount = await this.prisma.bankAccount.findFirst({
      where: { userId, accountNumber, bankCode },
    });
    if (existingAccount) {
      throw new ConflictException('This bank account has already been added.');
    }

    let verifiedAccountName: string;
    try {
      const result = await this.paystackService.resolveBankAccount(accountNumber, bankCode);
      verifiedAccountName = result.accountName;
    } catch (error) {
      // --- TYPE-SAFE ERROR HANDLING ---
      // 1. Check if the error is an instance of the standard Error class.
      if (error instanceof Error) {
        // Now TypeScript knows `error` has a `message` property.
        this.logger.error(`Account verification failed for user ${userId}: ${error.message}`);
      } else {
        // If it's not a standard Error, log the entire object to inspect it.
        this.logger.error(`An unexpected, non-Error type was thrown during account verification for user ${userId}:`, error);
      }
      
      throw new BadRequestException('The provided bank account details could not be verified. Please check and try again.');
    }

    this.logger.log(`Successfully verified account for user ${userId}. Saving to database.`);
    
    // This second try-catch is also important for the createTransferRecipient call
    let recipientCode: string;
    try {
        const result = await this.paystackService.createTransferRecipient(
            verifiedAccountName,
            accountNumber,
            bankCode
        );
        recipientCode = result.recipientCode;
    } catch (error) {
        if (error instanceof Error) {
            this.logger.error(`Failed to create Paystack transfer recipient for user ${userId}: ${error.message}`);
        } else {
            this.logger.error(`An unexpected error occurred during transfer recipient creation for user ${userId}:`, error);
        }
        throw new BadRequestException('Could not save bank account with our payment provider.');
    }


    const newBankAccount = await this.prisma.bankAccount.create({
      data: {
        id: createId(),
        userId,
        accountNumber,
        bankCode,
        accountName: verifiedAccountName,
        isVerified: true,
        provider: Provider.PAYSTACK,
        bankName: data.bankName,
        accountType: data.accountType,
        providerRef: recipientCode,
      },
    });

    // Return a sanitized version of the bank account, hiding the providerRef
    const { providerRef, ...sanitizedResult } = newBankAccount;
    return sanitizedResult;
  }

  async getAccountsForUser(userId: string) {
    return this.prisma.bankAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        isPrimary: true,
      }
    });
  }
}