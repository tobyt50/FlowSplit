import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { LimitService } from '@flowsplit/limits';

@Controller('limits') // Route: /api/limits
@UseGuards(JwtAuthGuard)
export class LimitsController {
  constructor(private readonly limitService: LimitService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: User) {
    return this.limitService.getLimitStatus(user.id);
  }
}