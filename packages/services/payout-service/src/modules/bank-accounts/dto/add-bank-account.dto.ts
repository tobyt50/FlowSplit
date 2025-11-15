import { IsEnum, IsNotEmpty, IsString, Length } from 'class-validator';
import { AccountType } from '@flowsplit/prisma';

export class AddBankAccountDto {
  @IsString()
  @Length(10, 10, { message: 'Account number must be 10 digits.' })
  accountNumber!: string;

  @IsString()
  @IsNotEmpty()
  bankName!: string; // e.g., "Guaranty Trust Bank"

  @IsString()
  @IsNotEmpty()
  bankCode!: string; // The official NIP code, e.g., "058"

  @IsEnum(AccountType)
  @IsNotEmpty()
  accountType!: AccountType;
}