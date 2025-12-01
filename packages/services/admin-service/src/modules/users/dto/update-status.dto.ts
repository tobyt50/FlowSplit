import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UserStatus } from '@flowsplit/prisma';

/**
 * Defines the data structure for updating a user's status.
 * This is used as the request body for the PATCH /admin/users/:id/status endpoint.
 */
export class UpdateStatusDto {
  /**
   * The new status to apply to the user.
   * Must be one of the values from the UserStatus enum (ACTIVE, SUSPENDED, DEACTIVATED).
   */
  @IsEnum(UserStatus)
  @IsNotEmpty()
  status!: UserStatus;

  /**
   * An optional, human-readable reason for the status change.
   * This is crucial for the audit log.
   */
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}