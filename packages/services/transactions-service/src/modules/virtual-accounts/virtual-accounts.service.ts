import { Injectable, Logger, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService, Provider, Currency } from '@flowsplit/prisma';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class VirtualAccountsService {
  private readonly logger = new Logger(VirtualAccountsService.name);
  private readonly paystackClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.paystackClient = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${this.configService.get('PAYSTACK_SECRET_KEY')}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Retrieves the user's virtual account.
   * If it doesn't exist, it attempts to provision one via Paystack.
   */
  async getOrCreateVirtualAccount(userId: string) {
    // 1. Check DB first
    const existingAccount = await this.prisma.virtualAccount.findUnique({
      where: { userId },
    });

    if (existingAccount) {
      return existingAccount;
    }

    // 2. Provision new account if missing
    this.logger.log(`Provisioning new Virtual Account for user ${userId}`);
    return this.provisionPaystackDVA(userId);
  }

  private async provisionPaystackDVA(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (!user.phone) {
        // In a full-scale app, we might redirect them to a profile update flow here.
        // For the API, we throw a specific error.
        this.logger.warn(`User ${userId} attempted to create DVA without a phone number.`);
        throw new BadRequestException('A phone number is required to generate a virtual account. Please update your profile settings.');
    }

    try {
      // Step A: Ensure user has a Paystack Customer Code
      let customerCode = user.providerId;

      if (!customerCode) {
        // Create customer on Paystack
        const custResponse = await this.paystackClient.post('/customer', {
          email: user.email,
          first_name: user.firstName,
          last_name: user.lastName,
          phone: user.phone,
        });
        customerCode = custResponse.data.data.customer_code;

        // Save for future use
        await this.prisma.user.update({
          where: { id: userId },
          data: { providerId: customerCode, provider: Provider.PAYSTACK },
        });
      }

      // Step B: Request a Dedicated Virtual Account
      const dvaResponse = await this.paystackClient.post('/dedicated_account', {
        customer: customerCode,
        preferred_bank: 'wema-bank', // Wema is the standard provider for Paystack DVAs
      });

      const data = dvaResponse.data.data;

      // Step C: Save to DB
      const newAccount = await this.prisma.virtualAccount.create({
        data: {
          id: createId(),
          userId,
          bankName: data.bank.name,
          accountNumber: data.account_number,
          accountName: data.account_name,
          currency: Currency.NGN,
          provider: Provider.PAYSTACK,
          providerRef: data.id.toString(),
        },
      });

      return newAccount;

    } catch (error: any) {
      this.logger.error('Failed to provision DVA:', error.response?.data || error.message);
      // Fallback for DEV/TEST environments if Paystack fails (e.g., unverified business)
      if (process.env.NODE_ENV !== 'production') {
         this.logger.warn('Using Mock DVA for Development');
         return this.prisma.virtualAccount.create({
             data: {
                 id: createId(),
                 userId,
                 bankName: 'Test Bank (Dev)',
                 accountNumber: '9900' + Math.floor(100000 + Math.random() * 900000),
                 accountName: 'FlowSplit - ' + user.firstName + ' ' + user.lastName, 
                 provider: Provider.MANUAL
             }
         });
      }
      throw new InternalServerErrorException('Could not generate virtual account. Please try again later.');
    }
  }
}