import { IsNotEmpty, IsString, IsNumber, Min } from 'class-validator';
import { IsCuid } from '@flowsplit/prisma';

export class InitiatePayoutDto {
  @IsCuid()
  @IsNotEmpty()
  sourceWalletId!: string;

  @IsCuid()
  @IsNotEmpty()
  destinationBankId!: string;

  @IsNumber()
  @Min(10000) // Minimum payout amount, e.g., 100.00 NGN
  amount!: number; // Amount in kobo

  @IsString()
  @IsNotEmpty()
  // This is the idempotent reference from the client to prevent duplicate submissions
  reference!: string;
}