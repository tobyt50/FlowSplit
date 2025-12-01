import { Injectable, Logger } from '@nestjs/common';
import { PrismaService, AdminActionType, User, AuditLogLevel } from '@flowsplit/prisma';
import { createId } from '@paralleldrive/cuid2';
import { AlertingService, AlertLevel } from '../alerting/alerting.service';

interface AuditLogEntry {
  admin: User;
  action: AdminActionType;
  level: AuditLogLevel;
  targetUserId?: string;
  targetEntityId?: string;
  details?: Record<string, any>;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertingService: AlertingService,
  ) {}

  /**
   * Creates an immutable record of an administrative action.
   * This is a fire-and-forget operation from the perspective of the calling service.
   * @param entry - The details of the action to be logged.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.adminAuditLog.create({
        data: {
          id: createId(),
          adminUserId: entry.admin.id,
          adminUserEmail: entry.admin.email,
          action: entry.action,
          level: entry.level,
          targetUserId: entry.targetUserId,
          targetEntityId: entry.targetEntityId,
          details: entry.details || {},
        },
      });
    } catch (error: unknown) {
        
      let errorMessage: string;
      let errorStack: string | undefined;

      if (error instanceof Error) {
        errorMessage = error.message;
        errorStack = error.stack;
      } else {
        errorMessage = String(error);
      }
      // --------------------------------

      this.logger.error(
        'CRITICAL: Failed to write to admin audit log.',
        {
          error: errorMessage,
          stack: errorStack,
          entry,
        }
      );

      this.alertingService.sendAlert({
        level: AlertLevel.CRITICAL,
        message: 'CRITICAL FAILURE: Admin Audit Log Write Failed',
        context: {
          errorMessage: errorMessage,
          failedEntry: entry,
        },
      });
    }
  }
}