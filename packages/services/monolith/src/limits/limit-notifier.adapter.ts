import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import { ILimitNotifier, LimitAlertPayload } from '@flowsplit/limits';

@Injectable()
export class RabbitLimitNotifier implements ILimitNotifier {
  constructor(
    @Inject('NOTIFICATION_SERVICE') private readonly client: ClientProxy
  ) {}

  async sendLimitAlert(payload: LimitAlertPayload): Promise<void> {
    const title = payload.threshold === '100' ? 'Daily Limit Reached' : 'Approaching Daily Limit';
    const message = payload.threshold === '100' 
        ? `You have hit 100% of your daily transaction limit. Further transactions will be declined.` 
        : `You have used ${payload.percentUsed.toFixed(0)}% of your daily limit.`;
    const type = payload.threshold === '100' ? 'ERROR' : 'WARNING';

    // Construct the notification payload expected by notification-service
    const eventData = {
        userId: payload.userId,
        type: type,
        title: title,
        message: message,
        actionUrl: '/dashboard/overview' // Or a limits page
    };

    // Fire and forget event
    this.client.emit('notification.create', new RmqRecordBuilder(eventData).build());
  }
}