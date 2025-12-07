import { Controller, Get, Post, Body, Param, UseGuards, Delete, Query, Patch } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { UpdateWalletDto } from './dto/update-wallet.dto';

class TransferDto {
  @IsString() @IsNotEmpty() fromWalletId!: string;
  @IsString() @IsNotEmpty() toWalletId!: string;
  @IsNumber() @Min(1) amount!: number; // kobo
}

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

  @Delete(':id')
  delete(
    @Param('id') id: string, 
    @CurrentUser() user: User, 
    @Query('targetWalletId') targetWalletId?: string // Optional query param
  ) {
    return this.walletsService.deleteWallet(user.id, id, targetWalletId);
  }

   @Post('transfer')
  transfer(@CurrentUser() user: User, @Body() body: TransferDto) {
    return this.walletsService.transferFunds(user.id, body.fromWalletId, body.toWalletId, BigInt(body.amount));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletsService.update(user.id, id, updateWalletDto);
  }
}