import { Injectable } from '@nestjs/common';
import { PrismaService, Prisma } from '@flowsplit/prisma';
import { QueryLogsDto } from './dto/query-logs.dto';

@Injectable()
export class AdminLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async find(queryDto: QueryLogsDto) {
    const { page = 1, limit = 50, ...filters } = queryDto;

    const where: Prisma.AdminAuditLogWhereInput = {};

    // Dynamically build the query based on provided filters
    if (filters.adminUserId) where.adminUserId = filters.adminUserId;
    if (filters.targetUserId) where.targetUserId = filters.targetUserId;
    if (filters.action) where.action = filters.action;
    if (filters.level) where.level = filters.level;
    if (filters.startDate || filters.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
      if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;
    const [logs, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.adminAuditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }
}