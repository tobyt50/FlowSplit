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

export class PaystackCustomerDto {
  @IsEmail()
  email!: string;
}
export class PaystackDataDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsNumber()
  amount!: number;

  @IsString()
  currency!: string;

  @IsString()
  status!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PaystackCustomerDto)
  customer!: PaystackCustomerDto;
}
export class PaystackChargeSuccessDto {
  @IsString()
  event!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => PaystackDataDto)
  data!: PaystackDataDto;
}