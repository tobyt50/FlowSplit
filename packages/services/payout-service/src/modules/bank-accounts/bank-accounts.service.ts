import { Injectable, Logger, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PayoutStatus, PrismaService, Provider } from '@flowsplit/prisma';
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
      if (error instanceof Error) {
        this.logger.error(`Account verification failed for user ${userId}: ${error.message}`);
      } else {
        this.logger.error(`An unexpected, non-Error type was thrown during account verification for user ${userId}:`, error);
      }
      
      throw new BadRequestException('The provided bank account details could not be verified. Please check and try again.');
    }

    this.logger.log(`Successfully verified account for user ${userId}. Saving to database.`);
    
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

  /**
   * Sets a specific bank account as the primary account for the user.
   * Atomically unsets any existing primary account.
   */
  async setPrimary(userId: string, accountId: string) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.bankAccount.findFirst({
        where: { id: accountId, userId },
      });

      if (!account) {
        throw new NotFoundException('Bank account not found.');
      }

      // 1. Unset 'isPrimary' for all user's accounts
      await tx.bankAccount.updateMany({
        where: { userId, isPrimary: true },
        data: { isPrimary: false },
      });

      // 2. Set 'isPrimary' for the target account
      return tx.bankAccount.update({
        where: { id: accountId },
        data: { isPrimary: true },
      });
    });
  }

  /**
   * Safely removes a bank account.
   * BLOCKS deletion if there are pending payouts to this account.
   */
  async remove(userId: string, accountId: string) {
    // 1. Verify ownership
    const account = await this.prisma.bankAccount.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found.');
    }

    // 2. SAFETY CHECK: Check for in-flight payouts
    const activePayouts = await this.prisma.payout.findFirst({
      where: {
        destinationBankId: accountId,
        status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] },
      },
    });

    if (activePayouts) {
      throw new BadRequestException(
        'Cannot delete this account because a payout to it is currently in progress. Please wait for the payout to complete.'
      );
    }

    // 3. Delete
    await this.prisma.bankAccount.delete({
      where: { id: accountId },
    });
  }
}