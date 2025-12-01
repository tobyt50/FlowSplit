import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';
import { EmailService } from '../email/email.service';
import { formatCurrency } from '../../utils/currency-formatter';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Handles the 'deposit.received' event from the event bus.
   */
  async handleDepositReceived(payload: { userId: string; transactionId: string; amount: bigint }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      this.logger.warn(`User not found for deposit notification: ${payload.userId}`);
      return;
    }

    const formattedAmount = formatCurrency(payload.amount);

    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SUCCESS',
        title: 'Deposit Received',
        message: `We received your deposit of ${formattedAmount} and have split it.`,
        actionUrl: `/dashboard/transactions/${payload.transactionId}`,
      },
    });

    // 2. Send Email Notification
    await this.emailService.sendHtmlEmail({
      to: user.email,
      subject: 'Money Received! 💸',
      title: `Incoming Deposit: ${formattedAmount}`,
      body: `Your funds have landed safely. FlowSplit is currently distributing them according to your active rules. Click the button below to see the full breakdown.`,
      actionText: 'View Transaction',
      actionUrl: `http://localhost:3000/dashboard/transactions/${payload.transactionId}`,
    });
  }

  /**
   * Handles the 'payout.success' event from the event bus.
   */
  async handlePayoutSuccess(payload: { userId: string; payoutId: string; amount: bigint; bankName: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      this.logger.warn(`User not found for payout.success notification: ${payload.userId}`);
      return;
    }

    const formattedAmount = formatCurrency(payload.amount);
    
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'SUCCESS',
        title: 'Payout Successful',
        message: `Your withdrawal of ${formattedAmount} to your ${payload.bankName} account is complete.`,
        actionUrl: `/dashboard/payouts/${payload.payoutId}`,
      },
    });

    await this.emailService.sendHtmlEmail({
      to: user.email,
      subject: 'Your Payout is Complete!',
      title: 'Withdrawal Successful',
      body: `The ${formattedAmount} you sent to your ${payload.bankName} account has been successfully processed.`,
      actionText: 'View Payouts',
      actionUrl: `http://localhost:3000/dashboard/bank-accounts`,
    });
  }
  
  /**
   * Handles the 'payout.failed' event from the event bus.
   */
  async handlePayoutFailed(payload: { userId: string; payoutId: string; amount: bigint; reason: string }) {
      const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
      if (!user) {
        this.logger.warn(`User not found for payout.failed notification: ${payload.userId}`);
        return;
      }

      const formattedAmount = formatCurrency(payload.amount);

      await this.prisma.notification.create({
          data: {
              userId: user.id,
              type: 'ERROR',
              title: 'Payout Failed',
              message: `Your withdrawal of ${formattedAmount} failed. Reason: ${payload.reason}`,
              actionUrl: `/dashboard/payouts/${payload.payoutId}`,
          },
      });

      await this.emailService.sendHtmlEmail({
        to: user.email,
        subject: 'Action Required: Your Payout Failed',
        title: 'Withdrawal Failed',
        body: `We were unable to process your withdrawal of ${formattedAmount}. The funds have been returned to your wallet. <br/><br/><strong>Reason:</strong> ${payload.reason}`,
        actionText: 'Check Bank Accounts',
        actionUrl: `http://localhost:3000/dashboard/bank-accounts`,
      });
  }


  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async markAsRead(userId: string, notificationId: string) {
    const { count } = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
    if (count === 0) {
      throw new NotFoundException('Notification not found or you do not have permission to update it.');
    }
    return { status: 'success' };
  }
}