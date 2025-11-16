import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, ValidateNested, IsEnum, IsOptional } from 'class-validator';

// 1. Enum for Paystack events
export enum PaystackEventType {
  TRANSFER_SUCCESS = 'transfer.success',
  TRANSFER_FAILED = 'transfer.failed',
}

// 2. DTO for the nested `data` object
export class PaystackTransferDataDto {
  @IsString()
  @IsNotEmpty()
  reference!: string;

  @IsString()
  @IsOptional()
  failure_reason?: string | null;
}

// 3. DTO for transfer.success
export class PaystackTransferSuccessDto {
  @IsEnum(PaystackEventType)
  event!: PaystackEventType.TRANSFER_SUCCESS;

  @ValidateNested()
  @Type(() => PaystackTransferDataDto)
  data!: PaystackTransferDataDto;
}

// 4. DTO for transfer.failed
export class PaystackTransferFailedDto {
  @IsEnum(PaystackEventType)
  event!: PaystackEventType.TRANSFER_FAILED;

  @ValidateNested()
  @Type(() => PaystackTransferDataDto)
  data!: PaystackTransferDataDto;
}

// 5. Unified DTO for validation before routing
export class PaystackWebhookDto {
  @IsEnum(PaystackEventType)
  @IsNotEmpty()
  event!: PaystackEventType;

  @ValidateNested()
  @Type(() => PaystackTransferDataDto)
  data!: PaystackTransferDataDto;
}
