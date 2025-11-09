
import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { CreateRuleDto } from './dto/create-rule.dto';

@Controller('rules')
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Post()
  create(@Body() createRuleDto: CreateRuleDto, @CurrentUser() user: User) {
    return this.rulesService.create(user.id, createRuleDto);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.rulesService.findAllForUser(user.id);
  }
}