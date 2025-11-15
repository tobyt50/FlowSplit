import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { PayoutsService } from './payouts.service';
import { InitiatePayoutDto } from './dto/initiate-payout.dto';

@Controller('payouts')
@UseGuards(JwtAuthGuard)
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('initiate')
  initiatePayout(
    @CurrentUser() user: User,
    @Body() initiatePayoutDto: InitiatePayoutDto,
  ) {
    return this.payoutsService.initiate(user.id, initiatePayoutDto);
  }
}