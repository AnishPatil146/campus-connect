import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  /**
   * Write an audit log entry.
   * The module/entityType/entityId parameters are optional for backwards compatibility.
   */
  async log(
    userId: string | null,
    userName: string,
    role: string,
    action: string,
    details?: string,
    module?: string,
    entityType?: string,
    entityId?: string,
    ipAddress?: string,
  ) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          userId,
          userName,
          role,
          action,
          details,
          module,
          entityType,
          entityId,
          ipAddress,
        },
      });
    } catch (error) {
      console.error('Failed to write activity log:', error);
      return null;
    }
  }

  /**
   * Get audit logs with pagination, filtering, and search.
   */
  async getLogs(pagination?: PaginationDto, filters?: {
    userId?: string;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }) {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 50;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filters?.userId) where.userId = filters.userId;
      if (filters?.action) where.action = { contains: filters.action, mode: 'insensitive' };
      if (filters?.module) where.module = filters.module;
      if (filters?.search) {
        where.OR = [
          { action: { contains: filters.search, mode: 'insensitive' } },
          { details: { contains: filters.search, mode: 'insensitive' } },
          { userName: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters?.startDate || filters?.endDate) {
        where.timestamp = {};
        if (filters.startDate) where.timestamp.gte = new Date(filters.startDate);
        if (filters.endDate) where.timestamp.lte = new Date(filters.endDate);
      }

      const [data, total] = await Promise.all([
        this.prisma.activityLog.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.activityLog.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      console.error('Failed to retrieve audit logs:', error);
      return { data: [], meta: { total: 0, page: 1, limit: 50, totalPages: 0, hasNextPage: false, hasPreviousPage: false } };
    }
  }

  /**
   * Get audit timeline for a specific entity.
   */
  async getEntityTimeline(entityType: string, entityId: string) {
    return this.prisma.activityLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get audit timeline for a specific user.
   */
  async getUserTimeline(userId: string, limit: number = 50) {
    return this.prisma.activityLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}
