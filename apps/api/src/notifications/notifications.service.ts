import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import {
  UpdatePreferenceDto,
  CreateBroadcastDto,
  SendNotificationDto,
} from './dto/notification-ops.dto';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateway: EventsGateway,
  ) {}

  async getPreferences(userId: string) {
    let pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) {
      pref = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return pref;
  }

  async updatePreferences(userId: string, dto: UpdatePreferenceDto) {
    await this.getPreferences(userId); // Ensure exists
    return this.prisma.notificationPreference.update({
      where: { userId },
      data: {
        allowPush: dto.allowPush !== undefined ? dto.allowPush : undefined,
        allowEmail: dto.allowEmail !== undefined ? dto.allowEmail : undefined,
        allowSMS: dto.allowSMS !== undefined ? dto.allowSMS : undefined,
        allowInApp: dto.allowInApp !== undefined ? dto.allowInApp : undefined,
      },
    });
  }

  async getInAppNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(userId: string, id: string) {
    const notif = await this.prisma.notification.findFirst({
      where: { id, userId },
    });
    if (!notif) {
      throw new NotFoundException(`Notification with ID "${id}" not found`);
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
    return { count: (await this.getInAppNotifications(userId)).filter(n => n.isRead).length };
  }

  async createBroadcast(
    dto: CreateBroadcastDto,
    senderId: string,
    collegeId: string,
    actorName: string,
    actorRole: string,
  ) {
    // 1. Resolve recipients based on target type
    const recipientUserIds: string[] = [];

    if (dto.targetType === 'ALL_STUDENTS') {
      const students = await this.prisma.student.findMany({
        where: { collegeId, status: 'ACTIVE' },
        select: { userId: true },
      });
      recipientUserIds.push(...students.map((s) => s.userId));
    } else if (dto.targetType === 'DEPARTMENT') {
      if (!dto.targetId) throw new BadRequestException('targetId is required for DEPARTMENT target type');
      const students = await this.prisma.student.findMany({
        where: { collegeId, departmentId: dto.targetId, status: 'ACTIVE' },
        select: { userId: true },
      });
      recipientUserIds.push(...students.map((s) => s.userId));
    } else if (dto.targetType === 'SEMESTER') {
      if (!dto.targetId) throw new BadRequestException('targetId is required for SEMESTER target type');
      const students = await this.prisma.student.findMany({
        where: { collegeId, semesterId: dto.targetId, status: 'ACTIVE' },
        select: { userId: true },
      });
      recipientUserIds.push(...students.map((s) => s.userId));
    } else if (dto.targetType === 'DIVISION') {
      if (!dto.targetId) throw new BadRequestException('targetId is required for DIVISION target type');
      const students = await this.prisma.student.findMany({
        where: { collegeId, divisionId: dto.targetId, status: 'ACTIVE' },
        select: { userId: true },
      });
      recipientUserIds.push(...students.map((s) => s.userId));
    } else if (dto.targetType === 'TEACHERS') {
      const teachers = await this.prisma.teacher.findMany({
        where: { collegeId, status: 'ACTIVE' },
        select: { userId: true },
      });
      recipientUserIds.push(...teachers.map((t) => t.userId));
    }

    if (recipientUserIds.length === 0) {
      throw new BadRequestException('No recipients matched the specified broadcast target criteria');
    }

    // Remove duplicates
    const uniqueUserIds = Array.from(new Set(recipientUserIds));

    // 2. Perform transaction to save Broadcast, Log, and generate individual notifications
    const broadcast = await this.prisma.$transaction(async (tx) => {
      const createdBroadcast = await tx.broadcastMessage.create({
        data: {
          collegeId,
          senderId,
          title: dto.title,
          body: dto.body,
          targetType: dto.targetType,
          targetId: dto.targetId || null,
        },
      });

      // Log broadcast summary
      await tx.broadcastLog.create({
        data: {
          broadcastId: createdBroadcast.id,
          recipientCount: uniqueUserIds.length,
          deliveredCount: uniqueUserIds.length, // Assume in-app delivers immediately
          readCount: 0,
          failedCount: 0,
        },
      });

      // Create individual in-app notification records for everyone
      for (const recipientId of uniqueUserIds) {
        const notif = await tx.notification.create({
          data: {
            userId: recipientId,
            title: dto.title,
            body: dto.body,
            type: NotificationType.IN_APP,
            link: '/dashboard',
          },
        });

        await tx.notificationRecipient.create({
          data: {
            notificationId: notif.id,
            userId: recipientId,
            isDelivered: true,
            deliveredAt: new Date(),
          },
        });
      }

      return createdBroadcast;
    });

    // Audit log entry
    await this.audit.log(
      senderId,
      actorName,
      actorRole,
      'CREATE_BROADCAST',
      `Sent broadcast "${dto.title}" targeting "${dto.targetType}"`,
      'notifications',
      'BroadcastMessage',
      broadcast.id,
    );

    // Socket gateway broadcast
    this.gateway.broadcast('BROADCAST.SENT', {
      id: broadcast.id,
      title: broadcast.title,
      body: broadcast.body,
      targetType: broadcast.targetType,
    });

    for (const recipientId of uniqueUserIds) {
      this.gateway.broadcastToUser(recipientId, 'notification:new', {
        title: dto.title,
        body: dto.body,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    return broadcast;
  }

  async getBroadcasts(collegeId: string) {
    return this.prisma.broadcastMessage.findMany({
      where: { collegeId },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        logs: true,
      },
      orderBy: { sentAt: 'desc' },
    });
  }

  async sendNotification(dto: SendNotificationDto) {
    const pref = await this.getPreferences(dto.recipientId);
    const nType = (dto.type || 'IN_APP') as NotificationType;

    // Check preference restrictions
    if (nType === 'IN_APP' && !pref.allowInApp) return null;
    if (nType === 'EMAIL' && !pref.allowEmail) return null;
    if (nType === 'SMS' && !pref.allowSMS) return null;
    if (nType === 'PUSH' && !pref.allowPush) return null;

    const notif = await this.prisma.$transaction(async (tx) => {
      const created = await tx.notification.create({
        data: {
          userId: dto.recipientId,
          title: dto.title,
          body: dto.body,
          type: nType,
          link: dto.link || null,
          metadata: dto.metadata || null,
        },
      });

      // Queue external channels
      if (nType !== 'IN_APP') {
        const userDetails = await tx.user.findUnique({
          where: { id: dto.recipientId },
        });

        if (userDetails) {
          const address = nType === 'EMAIL' ? userDetails.email : 'External Channel';
          await tx.notificationQueue.create({
            data: {
              notificationId: created.id,
              recipientType: nType,
              recipientAddress: address,
              subject: dto.title,
              body: dto.body,
              status: 'PENDING',
            },
          });
        }
      } else {
        await tx.notificationRecipient.create({
          data: {
            notificationId: created.id,
            userId: dto.recipientId,
            isDelivered: true,
            deliveredAt: new Date(),
          },
        });
      }

      // Log immediately
      await tx.notificationLog.create({
        data: {
          userId: dto.recipientId,
          notificationId: created.id,
          channel: nType,
          status: nType === 'IN_APP' ? 'DELIVERED' : 'SENT',
        },
      });

      return created;
    });

    if (nType === 'IN_APP') {
      this.gateway.broadcastToUser(dto.recipientId, 'NOTIFICATION.RECEIVED', notif);
      this.gateway.broadcastToUser(dto.recipientId, 'notification:new', notif);
    }

    return notif;
  }

  async getQueue() {
    return this.prisma.notificationQueue.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'asc' },
    });
  }

  async processQueue() {
    const pending = await this.getQueue();
    const processed: any[] = [];

    for (const item of pending) {
      await this.prisma.$transaction(async (tx) => {
        await tx.notificationQueue.update({
          where: { id: item.id },
          data: {
            status: 'SENT',
            sentAt: new Date(),
          },
        });

        if (item.notificationId) {
          await tx.notificationLog.create({
            data: {
              userId: (await tx.notification.findUnique({ where: { id: item.notificationId } }))?.userId || 'unknown',
              notificationId: item.notificationId,
              channel: item.recipientType,
              status: 'DELIVERED',
            },
          });
        }
      });
      processed.push({ id: item.id, status: 'SENT' });
    }

    return { processedCount: processed.length, processed };
  }
}
