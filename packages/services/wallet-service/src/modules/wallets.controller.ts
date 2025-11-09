import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';

@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Post()
  create(
    @Body() createWalletDto: CreateWalletDto,
    @CurrentUser() user: User,
  ) {
    return this.walletsService.create(user.id, createWalletDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.walletsService.findAllForUser(user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.walletsService.findUserWalletById(user.id, id);
  }
}