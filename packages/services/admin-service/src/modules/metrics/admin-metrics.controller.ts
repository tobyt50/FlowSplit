import { Controller, Get, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { AdminMetricsService } from './admin-metrics.service';

@Controller('admin/metrics')
@UseGuards(AdminGuard)
export class AdminMetricsController {
  constructor(private readonly metricsService: AdminMetricsService) {}

  @Get()
  async getMetrics() {
    return this.metricsService.getDashboardMetrics();
  }

  @Get('user-growth')
  async getUserGrowth(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.metricsService.getUserGrowth(days);
  }
}