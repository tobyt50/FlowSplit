import { Injectable, Logger } from '@nestjs/common';
import { User, Wallet } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class MockIssuingService {
  private readonly logger = new Logger(MockIssuingService.name);

  constructor() {
    this.logger.warn('⚠️ USING MOCK CARD ISSUER - Transactions will be simulated.');
  }

  /**
   * Simulates issuing a card. Returns data in the exact format our controller expects.
   */
  async createVirtualCard(user: User, wallet: Wallet, nameOnCard: string) {
    this.logger.log(`[MockIssuer] Creating card for ${user.email} on wallet ${wallet.name}`);
    
    // Simulate API latency
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate fake card details
    const mockCardId = `ic_mock_${createId()}`;
    const mockLast4 = Math.floor(1000 + Math.random() * 9000).toString();

    return {
      providerCardId: mockCardId,
      last4: mockLast4,
      brand: 'Visa',
      expiryMonth: new Date().getMonth() + 1,
      expiryYear: new Date().getFullYear() + 3,
      cvc: '123',
    };
  }

  async updateCardStatus(providerCardId: string, status: 'active' | 'inactive') {
    this.logger.log(`[MockIssuer] Card ${providerCardId} status changed to: ${status}`);
    return true;
  }

  async cancelCard(providerCardId: string) {
    this.logger.log(`[MockIssuer] Card ${providerCardId} canceled.`);
    return true;
  }
}