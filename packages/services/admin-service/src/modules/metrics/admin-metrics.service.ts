import { Injectable } from '@nestjs/common';
import { PrismaService } from '@flowsplit/prisma';

export interface UserGrowthDataPoint {
  date: string; // "YYYY-MM-DD"
  count: number;
}

@Injectable()
export class AdminMetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardMetrics() {
    const [totalUsers, totalTransactions, totalAuditLogs] = await this.prisma.$transaction([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.adminAuditLog.count(),
    ]);
    return {
      totalUsers,
      totalTransactions,
      totalAuditLogs,
      criticalAlerts: 0,
    };
  }

  async getUserGrowth(days: number = 30): Promise<UserGrowthDataPoint[]> {
    const result: Array<{ date: Date, count: BigInt }> = await this.prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', "createdAt")::date as date,
        COUNT(id) as count
      FROM
        "User"
      WHERE
        "createdAt" >= NOW() - INTERVAL '${days} days'
      GROUP BY
        date
      ORDER BY
        date ASC;
    `;

    const dateMap = new Map<string, number>();
    for (const row of result) {
      dateMap.set(row.date.toISOString().split('T')[0], Number(row.count));
    }

    const finalData: UserGrowthDataPoint[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      finalData.push({
        date: dateString,
        count: dateMap.get(dateString) || 0,
      });
    }

    return finalData.reverse();
  }
}