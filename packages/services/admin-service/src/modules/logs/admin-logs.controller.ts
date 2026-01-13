import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../auth/admin.guard';
import { AdminLogsService } from './admin-logs.service';
import { QueryLogsDto } from './dto/query-logs.dto';

@Controller({ path: 'admin/logs', version: '1' })
@UseGuards(AdminGuard)
export class AdminLogsController {
  constructor(private readonly logsService: AdminLogsService) {}

  @Get()
  find(@Query() queryDto: QueryLogsDto) {
    return this.logsService.find(queryDto);
  }
}