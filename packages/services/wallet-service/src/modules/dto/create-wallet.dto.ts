import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { WalletType, Currency } from '@flowsplit/prisma';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name!: string;

  @IsEnum(WalletType)
  @IsNotEmpty()
  type!: WalletType;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency = Currency.NGN;
}