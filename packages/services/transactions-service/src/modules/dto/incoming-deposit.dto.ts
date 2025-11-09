import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '@flowsplit/prisma';

export class IncomingDepositDto {
  @IsString()
  @IsNotEmpty()
  reference!: string; // Unique reference from the payment provider

  @IsNumber()
  @IsNotEmpty()
  amount!: number;

  @IsString()
  @IsOptional()
  currency?: string = 'NGN';
  
  @IsString()
  @IsOptional() // The source bank account ID, if known
  accountId?: string;
}