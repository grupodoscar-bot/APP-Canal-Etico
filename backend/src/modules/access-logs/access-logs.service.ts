import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface LogEntry {
  tenantId?: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  eventType: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  success?: boolean;
  referenceId?: string;
  referenceType?: string;
  description?: string;
}

@Injectable()
export class AccessLogsService {
  constructor(private prisma: PrismaService) {}

  async log(entry: LogEntry) {
    return this.prisma.accessLog.create({ data: entry });
  }

  async findAll(tenantId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.accessLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.accessLog.count({ where: { tenantId } }),
    ]);
    return {
      data: data.map(d => ({ ...d, id: d.id.toString() })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
