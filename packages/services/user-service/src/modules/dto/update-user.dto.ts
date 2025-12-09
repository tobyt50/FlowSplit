import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @MaxLength(100)
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  // Strict regex for Nigerian/International format
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Phone number must be in a valid format (e.g., +234...)' })
  phone?: string;

  @IsOptional() @IsString() addressLine1?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsOptional() @IsString() @MaxLength(2) country?: string;
  @IsOptional()
  @IsDateString({}, { message: 'Date of birth must be a valid date string (e.g., YYYY-MM-DD)' })
  dateOfBirth?: string;
}