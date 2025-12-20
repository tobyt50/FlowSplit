import { Module } from '@nestjs/common';
import { AdminLimitsController } from './admin-limits.controller';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    AuditModule,
  ],
  controllers: [AdminLimitsController],
  providers: [],
})
export class AdminLimitsModule {}