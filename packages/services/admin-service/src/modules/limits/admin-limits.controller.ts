import { Controller, Get, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { PrismaService, KycTier, Currency, AdminActionType, AuditLogLevel, User } from '@flowsplit/prisma';
import { AuditService } from '../../audit/audit.service';
import { CurrentUser } from '@flowsplit/auth';
import { IsNumber, Min } from 'class-validator';

class UpdateLimitDto {
  @IsNumber() @Min(-1) maxPerTransaction!: number;
  @IsNumber() @Min(-1) maxDaily!: number;
  @IsNumber() @Min(-1) maxMonthly!: number;
}

@Controller('admin/limits')
@UseGuards(AdminGuard)
export class AdminLimitsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService
  ) {}

  @Get()
  async getLimits() {
    // Return all tiers sorted by hierarchy
    return this.prisma.tierLimit.findMany({
      orderBy: { tier: 'asc' }
    });
  }

  @Patch(':tier')
  async updateLimit(
    @Param('tier') tier: KycTier,
    @Body() body: UpdateLimitDto,
    @CurrentUser() admin: User
  ) {
    // 1. Audit this critical risk change
    await this.auditService.log({
      admin,
      action: AdminActionType.UPDATE_SYSTEM_CONFIG,
      level: AuditLogLevel.CRITICAL,
      details: { tier, changes: body }
    });

    // 2. Update DB
    // Convert numbers to BigInt for storage
    return this.prisma.tierLimit.update({
      where: { tier },
      data: {
        maxPerTransaction: BigInt(body.maxPerTransaction),
        maxDaily: BigInt(body.maxDaily),
        maxMonthly: BigInt(body.maxMonthly),
      }
    });
  }
}