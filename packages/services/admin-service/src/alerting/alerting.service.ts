import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export enum AlertLevel {
  CRITICAL = 'fatal',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

interface AlertPayload {
  level: AlertLevel;
  message: string;
  context?: Record<string, any>;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);

  /**
   * Sends a high-priority alert to the configured monitoring service (Sentry).
   * This should be used for critical, non-recoverable errors that require
   * immediate developer attention.
   *
   * @param payload - The details of the alert to send.
   */
  public sendAlert(payload: AlertPayload): void {
    this.logger.log(`Sending alert to Sentry: [${payload.level}] ${payload.message}`);

    const syntheticError = new Error(payload.message);

    Sentry.withScope(scope => {
      scope.setLevel(payload.level);
      if (payload.context) {
        scope.setContext("Alert Context", payload.context);
      }
      Sentry.captureException(syntheticError);
    });
  }
}