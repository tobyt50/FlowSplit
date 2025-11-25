import { IsBoolean, IsOptional, IsEnum, IsNumber, Min, Max, MaxLength, IsInt, IsString } from 'class-validator';
import { SplitType } from '@flowsplit/prisma';
import { IsCuid } from '@flowsplit/prisma';
import { Transform } from 'class-transformer'; // Optional: for string-to-number coercion

export class UpdateRuleDto {
  @IsString() @IsOptional() @MaxLength(50)
  name?: string;

  @IsEnum(SplitType) @IsOptional()
  type?: SplitType;

  @IsNumber() @IsOptional() @Min(0.01)
  // Optional: @Transform(({ value }) => parseFloat(value)) for string inputs
  value?: number;

  @IsCuid() @IsOptional()
  destinationWalletId?: string;

  @IsInt() @IsOptional() @Min(1)
  priority?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;

  @IsBoolean() @IsOptional()
  isBill?: boolean;

  @IsInt() @IsOptional() @Min(1) @Max(31)
  dueDate?: number;
}