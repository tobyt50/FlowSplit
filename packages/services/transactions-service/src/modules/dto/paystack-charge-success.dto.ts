import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsNumber,
  IsObject,
  ValidateNested,
  IsEnum,
} from 'class-validator';

// This mirrors the nested 'customer' object in the Paystack payload
class PaystackCustomerDto {
  @IsEmail()
  email!: string;
}

// This mirrors the nested 'data' object
class PaystackDataDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsNumber()
  amount!: number; // Amount is in the smallest currency unit (kobo)

  @IsString()
  currency!: string;

  @IsEnum(['success'])
  status!: 'success';

  @IsObject()
  @ValidateNested()
  @Type(() => PaystackCustomerDto)
  customer!: PaystackCustomerDto;
}

// This is the top-level DTO for the entire webhook payload
export class PaystackChargeSuccessDto {
  @IsEnum(['charge.success'])
  event!: 'charge.success';

  @IsObject()
  @ValidateNested()
  @Type(() => PaystackDataDto)
  data!: PaystackDataDto;
}