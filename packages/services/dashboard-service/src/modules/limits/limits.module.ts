import { Module } from '@nestjs/common';
import { LimitModule } from '@flowsplit/limits';
import { LimitsController } from './limits.controller';

@Module({
  imports: [
    LimitModule,
  ],
  controllers: [
    LimitsController,
  ],
})
export class AppLimitsModule {}