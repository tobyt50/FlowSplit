import { Controller, Get, Post, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { AdminKycService } from './admin-kyc.service';
import { CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { AuditService } from '../../audit/audit.service';
import { AdminActionType, AuditLogLevel } from '@flowsplit/prisma';

class ReviewKycDto {
  approved!: boolean;
  rejectionReason?: string;
}

@Controller({ path: 'admin/kyc', version: '1' })
@UseGuards(AdminGuard)
export class AdminKycController {
  constructor(
    private readonly kycService: AdminKycService,
    private readonly auditService: AuditService,
  ) {}

  @Get('pending')
  getPendingReviews() {
    return this.kycService.getPendingReviews();
  }

  @Get(':userId/documents')
  async getDocuments(@CurrentUser() admin: User, @Param('userId') userId: string) {
    // Audit access to sensitive docs
    await this.auditService.log({
      admin,
      action: AdminActionType.VIEW_USER_DETAILS, // Or create VIEW_KYC_DOCS
      level: AuditLogLevel.WARN,
      targetUserId: userId,
      details: { resource: 'KYC Documents' }
    });

    return this.kycService.getKycDocuments(userId);
  }

  @Post(':userId/review')
  async reviewKyc(
    @CurrentUser() admin: User,
    @Param('userId') userId: string,
    @Body() body: ReviewKycDto,
  ) {
    await this.auditService.log({
      admin,
      action: body.approved ? AdminActionType.UNSUSPEND_USER : AdminActionType.SUSPEND_USER, // Map to appropriate enum or add new ones like APPROVE_KYC
      level: AuditLogLevel.CRITICAL,
      targetUserId: userId,
      details: { approved: body.approved, reason: body.rejectionReason }
    });

    return this.kycService.processReview(userId, body.approved, body.rejectionReason);
  }
}