import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, isAxiosError } from 'axios'; // 1. Import the isAxiosError type guard

// Define the shape of expected responses for type safety
interface ResolveAccountResponse {
  status: boolean;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

interface CreateRecipientResponse {
  status: boolean;
  data: { recipient_code: string; };
}
interface InitiateTransferResponse {
  status: boolean;
  data: { transfer_code: string; };
}

@Injectable()
export class PaystackService {
  private readonly logger = new Logger(PaystackService.name);
  private readonly http: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secretKey) {
      throw new Error('Paystack secret key is not configured.');
    }

    this.http = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async resolveBankAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<{ accountName: string }> {
    try {
      const response = await this.http.get<ResolveAccountResponse>('/bank/resolve', {
        params: {
          account_number: accountNumber,
          bank_code: bankCode,
        },
      });
      if (response.data.status) {
        return { accountName: response.data.data.account_name };
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      // 2. --- TYPE-SAFE ERROR HANDLING ---
      if (isAxiosError(error)) {
        // Now TypeScript knows `error` has a `response` property
        this.logger.error(
          'Failed to resolve bank account with Paystack:',
          error.response?.data || error.message,
        );
      } else {
        // Handle non-Axios errors
        this.logger.error('An unexpected error occurred in resolveBankAccount:', error);
      }
      throw new Error('Could not verify bank account details.');
    }
  }

  async createTransferRecipient(
    accountName: string,
    accountNumber: string,
    bankCode: string,
  ): Promise<{ recipientCode: string }> {
    try {
      const response = await this.http.post<CreateRecipientResponse>('/transferrecipient', {
        type: 'nuban',
        name: accountName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      });
      if (response.data.status) {
        return { recipientCode: response.data.data.recipient_code };
      }
      throw new Error('Failed to create transfer recipient on Paystack.');
    } catch (error) {
      // --- TYPE-SAFE ERROR HANDLING ---
      if (isAxiosError(error)) {
        this.logger.error('Paystack createTransferRecipient failed:', error.response?.data);
      } else {
        this.logger.error('An unexpected error occurred in createTransferRecipient:', error);
      }
      throw new Error('Could not create transfer recipient.');
    }
  }

  async initiateTransfer(
    amount: number,
    reference: string,
    recipientCode: string,
  ): Promise<InitiateTransferResponse['data']> {
    try {
      const response = await this.http.post<InitiateTransferResponse>('/transfer', {
        source: 'balance',
        amount: amount,
        reference: reference,
        recipient: recipientCode,
        reason: 'FlowSplit Payout',
      });
      if (response.data.status) {
        return response.data.data;
      }
      throw new Error('Failed to initiate transfer on Paystack.');
    } catch (error) {
      // --- TYPE-SAFE ERROR HANDLING ---
      if (isAxiosError(error)) {
        this.logger.error('Paystack initiateTransfer failed:', error.response?.data);
      } else {
        this.logger.error('An unexpected error occurred in initiateTransfer:', error);
      }
      throw new Error('Could not initiate transfer.');
    }
  }
}