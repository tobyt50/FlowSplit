import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { AlertingModule } from '../alerting/alerting.module';

@Module({
  imports: [
    AlertingModule,
  ],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}