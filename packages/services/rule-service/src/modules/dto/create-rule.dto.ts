import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  Max,
  IsInt,
} from 'class-validator';
import { IsCuid, SplitType } from '@flowsplit/prisma';

/**
 * Defines the shape and validation rules for the data required to create a new Split Rule.
 * This DTO is the security gate for the create operation.
 */
export class CreateRuleDto {
  /**
   * A user-friendly name for the rule (e.g., "Rent Allocation").
   * Limited to 50 characters to prevent UI overflow and abuse.
   */
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  /**
   * The type of split, must be one of the values defined in the Prisma SplitType enum.
   */
  @IsEnum(SplitType)
  @IsNotEmpty()
  type!: SplitType;

  /**
   * The value for the rule's calculation.
   * For PERCENTAGE type, this is the percentage (e.g., 30 for 30%).
   * Must be a positive number and cannot exceed 100.
   */
  @IsNumber()
  @IsNotEmpty()
  @Min(0.01)
  @Max(100)
  value!: number;

  /**
   * The unique identifier for the destination wallet.
   * Must be a valid CUID2, enforced by our custom @IsCuid decorator.
   */
  @IsCuid()
  @IsNotEmpty()
  destinationWalletId!: string;

  /**
   * The execution priority of the rule (lower numbers run first).
   * Optional, defaults to 1. Must be a positive integer.
   */
  @IsInt()
  @Min(1)
  @IsOptional()
  priority?: number = 1;
}