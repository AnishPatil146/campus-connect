import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateway: EventsGateway,
  ) {}

  async findAll(collegeId?: string) {
    const where: any = {};
    if (collegeId) {
      where.collegeId = collegeId;
    }

    return this.prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targets: true,
        attachments: true,
      },
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        targets: true,
        attachments: true,
      },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID "${id}" not found`);
    }

    return announcement;
  }

  async create(dto: CreateAnnouncementDto, authorId: string, collegeId: string, actorName: string, actorRole: string) {
    const announcement = await this.prisma.$transaction(async (tx) => {
      const created = await tx.announcement.create({
        data: {
          title: dto.title,
          content: dto.content,
          category: dto.category,
          target: dto.target || 'Entire College',
          status: (dto.status || 'DRAFT') as any,
          priority: (dto.priority || 'NORMAL') as any,
          authorId,
          collegeId,
          publishedAt: dto.status === 'PUBLISHED' ? new Date() : null,
          scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        },
      });

      if (dto.targets && dto.targets.length > 0) {
        await tx.announcementTarget.createMany({
          data: dto.targets.map((t) => ({
            announcementId: created.id,
            targetType: t.targetType,
            targetId: t.targetId || null,
          })),
        });
      }

      if (dto.attachments && dto.attachments.length > 0) {
        await tx.announcementAttachment.createMany({
          data: dto.attachments.map((a) => ({
            announcementId: created.id,
            fileUrl: a.fileUrl,
            fileName: a.fileName,
            fileType: a.fileType,
            fileSize: a.fileSize || null,
          })),
        });
      }

      return tx.announcement.findUnique({
        where: { id: created.id },
        include: {
          author: { select: { id: true, name: true, email: true } },
          targets: true,
          attachments: true,
        },
      });
    });

    if (announcement) {
      await this.audit.log(
        authorId,
        actorName,
        actorRole,
        'CREATE_ANNOUNCEMENT',
        `Created announcement "${announcement.title}"`,
        'announcements',
        'Announcement',
        announcement.id,
      );

      this.gateway.broadcast('ANNOUNCEMENT.CREATED', announcement);
      this.gateway.broadcast('announcement:new', announcement);
    }

    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, userId: string, actorName: string, actorRole: string) {
    await this.findOne(id);

    const announcement = await this.prisma.$transaction(async (tx) => {
      const data: any = {
        title: dto.title,
        content: dto.content,
        category: dto.category,
        target: dto.target,
        status: dto.status as any,
        priority: dto.priority as any,
      };

      if (dto.status === 'PUBLISHED') {
        const existing = await tx.announcement.findUnique({ where: { id } });
        if (existing && !existing.publishedAt) {
          data.publishedAt = new Date();
        }
      }

      if (dto.scheduledAt) {
        data.scheduledAt = new Date(dto.scheduledAt);
      }

      await tx.announcement.update({
        where: { id },
        data,
      });

      if (dto.targets !== undefined) {
        await tx.announcementTarget.deleteMany({ where: { announcementId: id } });
        if (dto.targets && dto.targets.length > 0) {
          await tx.announcementTarget.createMany({
            data: dto.targets.map((t) => ({
              announcementId: id,
              targetType: t.targetType,
              targetId: t.targetId || null,
            })),
          });
        }
      }

      if (dto.attachments !== undefined) {
        await tx.announcementAttachment.deleteMany({ where: { announcementId: id } });
        if (dto.attachments && dto.attachments.length > 0) {
          await tx.announcementAttachment.createMany({
            data: dto.attachments.map((a) => ({
              announcementId: id,
              fileUrl: a.fileUrl,
              fileName: a.fileName,
              fileType: a.fileType,
              fileSize: a.fileSize || null,
            })),
          });
        }
      }

      return tx.announcement.findUnique({
        where: { id },
        include: {
          author: { select: { id: true, name: true, email: true } },
          targets: true,
          attachments: true,
        },
      });
    });

    if (announcement) {
      await this.audit.log(
        userId,
        actorName,
        actorRole,
        'UPDATE_ANNOUNCEMENT',
        `Updated announcement "${announcement.title}"`,
        'announcements',
        'Announcement',
        announcement.id,
      );

      this.gateway.broadcast('ANNOUNCEMENT.UPDATED', announcement);
    }

    return announcement;
  }

  async remove(id: string, userId: string, actorName: string, actorRole: string) {
    const existing = await this.findOne(id);
    const result = await this.prisma.$transaction(async (tx) => {
      return tx.announcement.delete({ where: { id } });
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'DELETE_ANNOUNCEMENT',
      `Deleted announcement "${existing.title}"`,
      'announcements',
      'Announcement',
      id,
    );

    this.gateway.broadcast('ANNOUNCEMENT.DELETED', { id });
    return result;
  }
}
