import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RulesService } from './rules.service';
import { JwtAuthGuard, CurrentUser } from '@flowsplit/auth';
import { User } from '@flowsplit/prisma';
import { CreateRuleDto } from './dto/create-rule.dto';
import { UpdateRuleDto } from './dto/update-rule.dto';

@Controller({ path: 'rules', version: '1' })
@UseGuards(JwtAuthGuard)
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  /**
   * Endpoint to create a new split rule for the authenticated user.
   */
  @Post()
  create(@Body() createRuleDto: CreateRuleDto, @CurrentUser() user: User) {
    return this.rulesService.create(user.id, createRuleDto);
  }

  /**
   * Endpoint to retrieve all split rules for the authenticated user.
   */
  @Get()
  findAll(@CurrentUser() user: User) {
    return this.rulesService.findAllForUser(user.id);
  }

  /**
   * Endpoint to update an existing split rule for the authenticated user.
   * The `:id` in the path is a parameter representing the rule's ID.
   */
  @Patch(':id')
  update(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() updateRuleDto: UpdateRuleDto,
  ) {
    return this.rulesService.update(user.id, id, updateRuleDto);
  }

  /**
   * Endpoint to delete a specific split rule for the authenticated user.
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.rulesService.remove(user.id, id);
  }
}