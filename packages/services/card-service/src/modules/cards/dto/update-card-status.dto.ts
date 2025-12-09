import { IsNotEmpty, IsEnum } from 'class-validator';

export enum UpdateCardStatus {
  ACTIVE = 'ACTIVE',
  FROZEN = 'FROZEN'
}

export class UpdateCardStatusDto {
  @IsNotEmpty()
  @IsEnum(UpdateCardStatus, { message: 'Status must be ACTIVE or FROZEN' })
  status!: UpdateCardStatus;
}