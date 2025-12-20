import { Controller, Get, Patch, Param, UseGuards, Logger, Post, Body, HttpCode, HttpStatus, NotFoundException } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { PrismaService, User } from '@flowsplit/prisma';
import { IsString, IsNotEmpty } from 'class-validator';

// A DTO for our internal test endpoint
class CreateTestNotificationDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsString() @IsNotEmpty() message!: string;
}

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  // Inject PrismaService for the test endpoint
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  @EventPattern('deposit.received')
  async handleDepositEvent(
    @Payload() data: { userId: string; transactionId: string; amount: bigint },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Event 'deposit.received' received for user ${data.userId}`);
    await this.processEvent(context, () =>
      this.notificationsService.handleDepositReceived(data),
    );
  }

  @EventPattern('payout.success')
  async handlePayoutSuccessEvent(
    @Payload() data: { userId: string; payoutId: string; amount: bigint; bankName: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Event 'payout.success' received for user ${data.userId}`);
    await this.processEvent(context, () =>
      this.notificationsService.handlePayoutSuccess(data),
    );
  }

  @EventPattern('payout.failed')
  async handlePayoutFailedEvent(
    @Payload() data: { userId: string; payoutId: string; amount: bigint; reason: string },
    @Ctx() context: RmqContext,
  ) {
    this.logger.log(`Event 'payout.failed' received for user ${data.userId}`);
    await this.processEvent(context, () =>
      this.notificationsService.handlePayoutFailed(data),
    );
  }

  @EventPattern('kyc.success')
  async handleKycSuccess(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.notificationsService.handleKycResult(data, true);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
    }
  }

  @EventPattern('kyc.failed')
  async handleKycFailed(@Payload() data: any, @Ctx() context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    try {
      await this.notificationsService.handleKycResult(data, false);
      channel.ack(originalMsg);
    } catch (error) {
      channel.nack(originalMsg, false, false);
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getUserNotifications(@CurrentUser() user: User) {
    return this.notificationsService.getUserNotifications(user.id);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  // --- INTERNAL TEST ENDPOINT ---
  @Post('test-create')
  @UseGuards(JwtAuthGuard)
  async createTestNotification(
    @CurrentUser() user: User,
    @Body() body: CreateTestNotificationDto,
  ) {
    if (process.env.NODE_ENV === 'production') {
        // This endpoint should not be exposed in a production environment
        return new NotFoundException();
    }
    await this.prisma.notification.create({
      data: {
        userId: user.id,
        type: 'INFO',
        title: body.title,
        message: body.message,
      },
    });
    return { status: 'ok', message: 'Test notification created.' };
  }


  private async processEvent(context: RmqContext, handler: () => Promise<void>) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    const messageId = originalMsg.properties.messageId;

    try {
      await handler();
      channel.ack(originalMsg);
      this.logger.log(`Successfully processed and acknowledged message: ${messageId}`);
    } catch (error: any) {
      this.logger.error(`Failed to process message ${messageId}: ${error.message}`, error.stack);
      
      const isTransient = error.message.includes('connect') || error.message.includes('timeout');

      if (isTransient) {
        this.logger.warn(`Transient error for message ${messageId}. Re-queueing for retry.`);
        channel.nack(originalMsg, false, true);
      } else {
        this.logger.error(`Permanent error for message ${messageId}. Discarding message to prevent queue blocking.`);
        channel.nack(originalMsg, false, false);
      }
    }
  }
}