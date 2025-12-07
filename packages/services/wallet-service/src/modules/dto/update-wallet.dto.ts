import { IsOptional, IsString, MaxLength, IsNumber, Min } from 'class-validator';

export class UpdateWalletDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  targetAmount?: number; // In kobo
}