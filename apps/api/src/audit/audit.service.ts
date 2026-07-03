import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(
    userId: string | null,
    userName: string,
    role: string,
    action: string,
    details?: string,
  ) {
    try {
      return await this.prisma.activityLog.create({
        data: {
          userId,
          userName,
          role,
          action,
          details,
        },
      });
    } catch (error) {
      console.error('Failed to write activity log:', error);
      return null;
    }
  }
}
