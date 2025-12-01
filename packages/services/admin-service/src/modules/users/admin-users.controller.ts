import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
  Patch,
} from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { AdminUsersService } from './admin-users.service';
import { AuditService } from '../../audit/audit.service';
import { AdminActionType, AuditLogLevel, User, UserStatus } from '@flowsplit/prisma';
import { CurrentUser } from '@flowsplit/auth';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('admin/users')
@UseGuards(AdminGuard)
export class AdminUsersController {
  constructor(
    private readonly usersService: AdminUsersService,
    private readonly auditService: AuditService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() admin: User,

    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    await this.auditService.log({
      admin,
      action: AdminActionType.VIEW_USER_LIST,
      level: AuditLogLevel.INFO,
      details: { page, limit },
    });
    
    return this.usersService.findAll(page, limit);
  }

  @Get(':id')
  async findOne(@CurrentUser() admin: User, @Param('id') id: string) {
    await this.auditService.log({
      admin,
      action: AdminActionType.VIEW_USER_DETAILS,
      level: AuditLogLevel.WARN,
      targetUserId: id,
    });
    
    return this.usersService.findOne(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @CurrentUser() admin: User,
    @Param('id') id: string,
    @Body() body: UpdateStatusDto,
  ) {
    const { status, reason } = body;
    const action = status === UserStatus.SUSPENDED 
      ? AdminActionType.SUSPEND_USER 
      : AdminActionType.UNSUSPEND_USER;

    await this.auditService.log({
      admin,
      action: action,
      level: AuditLogLevel.CRITICAL,
      targetUserId: id,
      details: { reason: reason || 'No reason provided.' },
    });

    return this.usersService.updateUserStatus(id, status, admin);
  }
}