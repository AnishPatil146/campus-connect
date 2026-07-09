import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from './events.gateway';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import {
  RegisterEventDto,
  SubmitAttendanceDto,
  SubmitResultDto,
  CreateCertificateDto,
  CreateFeedbackDto,
} from './dto/event-ops.dto';
import { EventStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private gateway: EventsGateway,
  ) {}

  async findAll(collegeId?: string) {
    const where: any = { deletedAt: null };
    if (collegeId) {
      where.collegeId = collegeId;
    }
    return this.prisma.event.findMany({
      where,
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        statistic: true,
      },
      orderBy: { startDatetime: 'desc' },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        category: true,
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        registrations: {
          include: {
            student: {
              include: { profile: true },
            },
          },
        },
        participants: {
          include: {
            student: {
              include: { profile: true },
            },
          },
        },
        gallery: true,
        documents: true,
        attendance: true,
        results: {
          include: {
            student: {
              include: { profile: true },
            },
          },
        },
        certificates: true,
        feedback: true,
        statistic: true,
      },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }

    return event;
  }

  async create(dto: CreateEventDto, createdById: string, collegeId: string, actorName: string, actorRole: string) {
    const event = await this.prisma.$transaction(async (tx) => {
      const newEvent = await tx.event.create({
        data: {
          collegeId,
          createdById,
          categoryId: dto.categoryId || null,
          title: dto.title,
          description: dto.description || null,
          venue: dto.venue || null,
          startDatetime: new Date(dto.startDatetime),
          endDatetime: dto.endDatetime ? new Date(dto.endDatetime) : null,
          registrationStart: dto.registrationStart ? new Date(dto.registrationStart) : null,
          registrationEnd: dto.registrationEnd ? new Date(dto.registrationEnd) : null,
          maximumParticipants: dto.maximumParticipants || null,
          registrationRequired: dto.registrationRequired ?? false,
          approvalRequired: dto.approvalRequired ?? false,
          status: dto.status || EventStatus.DRAFT,
        },
        include: { category: true },
      });

      // Initialize statistics
      await tx.eventStatistic.create({
        data: {
          eventId: newEvent.id,
        },
      });

      // Log event creation
      await tx.eventLog.create({
        data: {
          eventId: newEvent.id,
          action: 'CREATED',
          userId: createdById,
          details: 'Event created by host',
        },
      });

      return newEvent;
    });

    // Audit log
    await this.audit.log(
      createdById,
      actorName,
      actorRole,
      'CREATE_EVENT',
      `Created event "${dto.title}"`,
      'events',
      'Event',
      event.id,
    );

    // Socket emission
    this.gateway.broadcast('EVENT.CREATED', event);

    if (event.status === EventStatus.PUBLISHED) {
      this.gateway.broadcast('EVENT.PUBLISHED', event);
    }

    return event;
  }

  async update(id: string, dto: UpdateEventDto, userId: string, actorName: string, actorRole: string) {
    const existing = await this.findOne(id);

    const event = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.event.update({
        where: { id },
        data: {
          categoryId: dto.categoryId !== undefined ? dto.categoryId : existing.categoryId,
          title: dto.title !== undefined ? dto.title : existing.title,
          description: dto.description !== undefined ? dto.description : existing.description,
          venue: dto.venue !== undefined ? dto.venue : existing.venue,
          startDatetime: dto.startDatetime ? new Date(dto.startDatetime) : existing.startDatetime,
          endDatetime: dto.endDatetime !== undefined ? (dto.endDatetime ? new Date(dto.endDatetime) : null) : existing.endDatetime,
          registrationStart: dto.registrationStart !== undefined ? (dto.registrationStart ? new Date(dto.registrationStart) : null) : existing.registrationStart,
          registrationEnd: dto.registrationEnd !== undefined ? (dto.registrationEnd ? new Date(dto.registrationEnd) : null) : existing.registrationEnd,
          maximumParticipants: dto.maximumParticipants !== undefined ? dto.maximumParticipants : existing.maximumParticipants,
          registrationRequired: dto.registrationRequired !== undefined ? dto.registrationRequired : existing.registrationRequired,
          approvalRequired: dto.approvalRequired !== undefined ? dto.approvalRequired : existing.approvalRequired,
          status: dto.status !== undefined ? dto.status : existing.status,
        },
      });

      await tx.eventLog.create({
        data: {
          eventId: id,
          action: 'UPDATED',
          userId,
          details: 'Event details updated',
        },
      });

      return updated;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'UPDATE_EVENT',
      `Updated event "${event.title}"`,
      'events',
      'Event',
      id,
    );

    this.gateway.broadcast('EVENT.UPDATED', event);

    if (existing.status !== EventStatus.PUBLISHED && event.status === EventStatus.PUBLISHED) {
      this.gateway.broadcast('EVENT.PUBLISHED', event);
    }

    return event;
  }

  async remove(id: string, userId: string, actorName: string, actorRole: string) {
    const existing = await this.findOne(id);

    await this.prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.eventLog.create({
        data: {
          eventId: id,
          action: 'CANCELLED',
          userId,
          details: 'Event marked as deleted',
        },
      });
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'DELETE_EVENT',
      `Soft deleted event "${existing.title}"`,
      'events',
      'Event',
      id,
    );

    this.gateway.broadcast('EVENT.DELETED', { id });
  }

  async register(id: string, dto: RegisterEventDto, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);

    // Find student ID
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new BadRequestException(`Student with ID "${dto.studentId}" not found`);
    }

    // Check if already registered
    const existingReg = await this.prisma.eventRegistration.findFirst({
      where: { eventId: id, studentId: dto.studentId },
    });
    if (existingReg) {
      throw new BadRequestException('Student is already registered for this event');
    }

    // Determine registration status
    let regStatus = 'REGISTERED';
    if (event.approvalRequired) {
      regStatus = 'WAITLISTED';
    }

    // Check capacity if set
    if (event.maximumParticipants) {
      const activeRegCount = await this.prisma.eventRegistration.count({
        where: { eventId: id, status: 'REGISTERED' },
      });
      if (activeRegCount >= event.maximumParticipants) {
        regStatus = 'WAITLISTED';
      }
    }

    const reg = await this.prisma.$transaction(async (tx) => {
      const newReg = await tx.eventRegistration.create({
        data: {
          eventId: id,
          userId: student.userId,
          studentId: dto.studentId,
          status: regStatus,
        },
      });

      // Update registration count in statistics
      const regCount = await tx.eventRegistration.count({
        where: { eventId: id, status: 'REGISTERED' },
      });

      await tx.eventStatistic.update({
        where: { eventId: id },
        data: {
          registrationCount: regCount,
        },
      });

      await tx.eventLog.create({
        data: {
          eventId: id,
          action: 'REGISTRATION',
          userId: student.userId,
          details: `Student registered with status: ${regStatus}`,
        },
      });

      return newReg;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'REGISTER_EVENT',
      `Registered for event "${event.title}" with status "${regStatus}"`,
      'events',
      'EventRegistration',
      reg.id,
    );

    this.gateway.broadcast('EVENT.REGISTRATION', { eventId: id, registration: reg });

    return reg;
  }

  async approveRegistration(id: string, registrationId: string, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);
    const reg = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
    });
    if (!reg || reg.eventId !== id) {
      throw new NotFoundException('Registration not found for this event');
    }

    const updatedReg = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.eventRegistration.update({
        where: { id: registrationId },
        data: { status: 'REGISTERED' },
      });

      // Update statistics
      const regCount = await tx.eventRegistration.count({
        where: { eventId: id, status: 'REGISTERED' },
      });

      await tx.eventStatistic.update({
        where: { eventId: id },
        data: { registrationCount: regCount },
      });

      await tx.eventLog.create({
        data: {
          eventId: id,
          action: 'REGISTRATION',
          userId: reg.userId,
          details: 'Registration approved by admin',
        },
      });

      return updated;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'APPROVE_EVENT',
      `Approved registration ${registrationId} for event "${event.title}"`,
      'events',
      'EventRegistration',
      registrationId,
    );

    return updatedReg;
  }

  async submitAttendance(id: string, dto: SubmitAttendanceDto, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);

    const attendance = await this.prisma.$transaction(async (tx) => {
      const record = await tx.eventAttendance.create({
        data: {
          eventId: id,
          studentId: dto.studentId,
          status: dto.status,
          checkedInAt: dto.status === 'PRESENT' ? new Date() : null,
        },
      });

      // Also create participant record if present
      if (dto.status === 'PRESENT') {
        const participantExists = await tx.eventParticipant.findFirst({
          where: { eventId: id, studentId: dto.studentId },
        });
        if (!participantExists) {
          await tx.eventParticipant.create({
            data: {
              eventId: id,
              studentId: dto.studentId,
            },
          });
        }
      }

      // Update statistics
      const partCount = await tx.eventParticipant.count({ where: { eventId: id } });
      const attCount = await tx.eventAttendance.count({ where: { eventId: id, status: 'PRESENT' } });
      const regCount = await tx.eventRegistration.count({ where: { eventId: id, status: 'REGISTERED' } });
      const compPerc = regCount > 0 ? (attCount / regCount) * 100 : 0;

      await tx.eventStatistic.update({
        where: { eventId: id },
        data: {
          participationCount: partCount,
          attendanceCount: attCount,
          completionPercentage: compPerc,
        },
      });

      return record;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'SUBMIT_EVENT_ATTENDANCE',
      `Submitted attendance status "${dto.status}" for student ID "${dto.studentId}" in event "${event.title}"`,
      'events',
      'EventAttendance',
      attendance.id,
    );

    return attendance;
  }

  async submitResult(id: string, dto: SubmitResultDto, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);

    const result = await this.prisma.$transaction(async (tx) => {
      const res = await tx.eventResult.create({
        data: {
          eventId: id,
          studentId: dto.studentId,
          position: dto.position,
          score: dto.score || null,
          judgeRemarks: dto.judgeRemarks || null,
        },
      });

      await tx.eventLog.create({
        data: {
          eventId: id,
          action: 'COMPLETED',
          userId,
          details: `Result posted: student ${dto.studentId} got ${dto.position}`,
        },
      });

      return res;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'SUBMIT_EVENT_RESULT',
      `Submitted result position "${dto.position}" for student ID "${dto.studentId}" in event "${event.title}"`,
      'events',
      'EventResult',
      result.id,
    );

    this.gateway.broadcast('EVENT.COMPLETED', { eventId: id, result });

    return result;
  }

  async issueCertificate(id: string, dto: CreateCertificateDto, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);

    const cert = await this.prisma.$transaction(async (tx) => {
      const certificate = await tx.eventCertificate.create({
        data: {
          eventId: id,
          studentId: dto.studentId,
          certificateType: dto.certificateType,
          certificateUrl: dto.certificateUrl,
        },
      });

      const certCount = await tx.eventCertificate.count({ where: { eventId: id } });

      await tx.eventStatistic.update({
        where: { eventId: id },
        data: {
          certificatesIssued: certCount,
        },
      });

      return certificate;
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'ISSUE_EVENT_CERTIFICATE',
      `Issued "${dto.certificateType}" certificate to student ID "${dto.studentId}" for event "${event.title}"`,
      'events',
      'EventCertificate',
      cert.id,
    );

    this.gateway.broadcast('CERTIFICATE.GENERATED', { eventId: id, certificate: cert });

    return cert;
  }

  async submitFeedback(id: string, dto: CreateFeedbackDto, userId: string, actorName: string, actorRole: string) {
    const event = await this.findOne(id);

    const feedback = await this.prisma.eventFeedback.create({
      data: {
        eventId: id,
        studentId: dto.studentId,
        rating: dto.rating,
        comment: dto.comment || null,
      },
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'SUBMIT_EVENT_FEEDBACK',
      `Submitted feedback with rating ${dto.rating} for event "${event.title}"`,
      'events',
      'EventFeedback',
      feedback.id,
    );

    return feedback;
  }

  async getLogs(id: string) {
    await this.findOne(id);
    return this.prisma.eventLog.findMany({
      where: { eventId: id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async cancelRegistration(eventId: string, studentId: string, actorName: string, actorRole: string) {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: { eventId, studentId },
    });

    if (!registration) {
      throw new NotFoundException('Event registration not found');
    }

    const deleted = await this.prisma.eventRegistration.delete({
      where: { id: registration.id },
    });

    await this.prisma.eventLog.create({
      data: {
        eventId,
        userId: studentId,
        action: 'CANCELLED',
        details: `Cancelled registration for event ${eventId}`,
      },
    });

    await this.audit.log(
      studentId,
      actorName,
      actorRole,
      'UNREGISTER_EVENT',
      `Cancelled registration for event ${eventId}`,
      'events',
      'Event',
      eventId,
    );

    return deleted;
  }
}
