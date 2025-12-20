import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LimitService } from './limit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [LimitService],
  exports: [LimitService],
})
export class LimitModule {}