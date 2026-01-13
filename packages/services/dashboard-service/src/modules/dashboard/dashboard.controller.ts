import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { DashboardService } from './dashboard.service';

@Controller({ path: 'dashboard', version: '1' })
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('upcoming-bills')
  getUpcomingBills(@CurrentUser() user: User) {
    return this.dashboardService.getUpcomingBills(user.id);
  }

  @Get('cash-flow')
  getCashFlow(@CurrentUser() user: User) {
    return this.dashboardService.getCashFlow(user.id);
  }

  @Get('last-split')
  getLastSplitBreakdown(@CurrentUser() user: User) {
    return this.dashboardService.getLastSplitBreakdown(user.id);
  }
}