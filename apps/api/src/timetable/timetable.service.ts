import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTimetableDto, PublishTimetableDto, SubstituteTeacherDto, UpdateTimetableDto } from './dto/timetable.dto';

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createTimetable(dto: CreateTimetableDto, actorId: string, actorName: string, actorRole: string) {
    const timetable = await this.prisma.timetable.create({
      data: {
        collegeId: dto.collegeId,
        academicSessionId: dto.academicSessionId,
        departmentId: dto.departmentId,
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        divisionId: dto.divisionId,
        active: false,
        slots: dto.slots ? {
          create: dto.slots.map((slot) => ({
            dayOfWeek: slot.dayOfWeek,
            slotNumber: slot.slotNumber,
            startTime: slot.startTime || '09:00',
            endTime: slot.endTime || '10:00',
            subjectId: slot.subjectId || null,
            teacherId: slot.teacherId || null,
            divisionId: dto.divisionId,
            room: slot.room || null,
          })),
        } : undefined,
      },
      include: { slots: true },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Create Timetable',
      `Created timetable ${timetable.id}`,
      'timetable',
      'Timetable',
      timetable.id,
    );

    return timetable;
  }

  async updateTimetable(dto: UpdateTimetableDto, actorId: string, actorName: string, actorRole: string) {
    const timetable = await this.prisma.timetable.findUnique({ where: { id: dto.id } });
    if (!timetable) throw new NotFoundException('Timetable not found');

    const updated = await this.prisma.timetable.update({
      where: { id: dto.id },
      data: { active: dto.active ?? timetable.active },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Update Timetable',
      `Updated timetable ${dto.id}`,
      'timetable',
      'Timetable',
      dto.id,
    );

    return updated;
  }

  async getStudentTimetable(studentId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.timetableSlot.findMany({
      where: { divisionId: student.divisionId },
      include: { subject: true, teacher: true, division: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slotNumber: 'asc' }],
    });
  }

  async getTeacherTimetable(teacherId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { teacherId },
      include: { subject: true, division: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slotNumber: 'asc' }],
    });
  }

  async getClassTimetable(divisionId: string) {
    return this.prisma.timetableSlot.findMany({
      where: { divisionId },
      include: { subject: true, teacher: true },
      orderBy: [{ dayOfWeek: 'asc' }, { slotNumber: 'asc' }],
    });
  }

  async publishTimetable(dto: PublishTimetableDto, actorId: string, actorName: string, actorRole: string) {
    const timetable = await this.prisma.timetable.findUnique({ where: { id: dto.timetableId } });
    if (!timetable) throw new NotFoundException('Timetable not found');

    const version = dto.version ?? (await this.prisma.timetablePublish.count({ where: { timetableId: dto.timetableId } })) + 1;

    const published = await this.prisma.timetablePublish.create({
      data: {
        timetableId: dto.timetableId,
        version,
        publishedById: actorId,
        active: true,
      },
    });

    await this.prisma.timetable.update({
      where: { id: dto.timetableId },
      data: { active: true },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Publish Timetable',
      `Published timetable ${dto.timetableId} version ${version}`,
      'timetable',
      'Timetable',
      dto.timetableId,
    );

    return published;
  }

  async assignSubstitute(dto: SubstituteTeacherDto, actorId: string, actorName: string, actorRole: string) {
    const substitute = await this.prisma.substituteTeacher.create({
      data: {
        originalTeacherId: dto.originalTeacherId,
        substituteTeacherId: dto.substituteTeacherId,
        subjectId: dto.subjectId,
        date: new Date(dto.date),
        reason: dto.reason || null,
        approvedById: actorId,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Assign Substitute Teacher',
      `Assigned substitute teacher ${dto.substituteTeacherId} for ${dto.originalTeacherId}`,
      'timetable',
      'SubstituteTeacher',
      substitute.id,
    );

    return substitute;
  }

  async getHistory(timetableId: string) {
    return this.prisma.timetableHistory.findMany({
      where: { timetableId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async deleteTimetable(id: string, actorId: string, actorName: string, actorRole: string) {
    const timetable = await this.prisma.timetable.findUnique({ where: { id } });
    if (!timetable) throw new NotFoundException('Timetable not found');

    const deleted = await this.prisma.timetable.delete({
      where: { id },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Delete Timetable',
      `Deleted timetable ${id}`,
      'timetable',
      'Timetable',
      id,
    );

    return deleted;
  }
}
