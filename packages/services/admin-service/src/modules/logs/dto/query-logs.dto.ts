import { IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminActionType, AuditLogLevel } from '@flowsplit/prisma';
import { IsCuid } from '@flowsplit/prisma';

export class QueryLogsDto {
  
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer.' })
  @Min(1, { message: 'Page must be at least 1.' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer.' })
  @Min(1, { message: 'Limit must be at least 1.' })
  limit?: number = 50;

  @IsOptional()
  @IsCuid()
  adminUserId?: string;

  @IsOptional()
  @IsCuid()
  targetUserId?: string;

  @IsOptional()
  @IsEnum(AdminActionType)
  action?: AdminActionType;

  @IsOptional()
  @IsEnum(AuditLogLevel)
  level?: AuditLogLevel;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}