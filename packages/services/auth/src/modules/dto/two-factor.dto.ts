import { IsNotEmpty, IsString, Length, IsOptional } from 'class-validator';

export class TwoFactorCodeDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code!: string;
}

export class TwoFactorLoginDto {
  @IsNotEmpty()
  @IsString()
  tempToken!: string;

  @IsNotEmpty()
  @IsString()
  code!: string;
}