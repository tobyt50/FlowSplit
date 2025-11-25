import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
  IsInt,
  IsBoolean,
  IsOptional,
  Max,
} from 'class-validator';
import { SplitType } from '@flowsplit/prisma';
import { IsCuid } from '@flowsplit/prisma';

export class CreateRuleDto {
  @IsString() 
  @IsNotEmpty() 
  @MaxLength(50) 
  name!: string;

  @IsEnum(SplitType) 
  @IsNotEmpty() 
  type!: SplitType;

  @IsNumber() 
  @IsNotEmpty() 
  @Min(0.01) 
  value!: number;

  @IsCuid() 
  @IsNotEmpty() 
  destinationWalletId!: string;

  @IsInt() 
  @Min(1) 
  @IsNotEmpty() 
  priority!: number;

  // Bill fields
  @IsBoolean() @IsOptional()
  isBill?: boolean;

  @IsInt() @IsOptional() @Min(1) @Max(31)
  dueDate?: number;
}