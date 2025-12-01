import { Module } from '@nestjs/common';
import { AdminMetricsController } from './admin-metrics.controller';
import { AdminMetricsService } from './admin-metrics.service';

@Module({
  imports: [
  ],
  controllers: [AdminMetricsController],
  providers: [
    AdminMetricsService
  ],
})
export class AdminMetricsModule {}