import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateTimetableDto, PublishTimetableDto, SubstituteTeacherDto, UpdateTimetableDto } from './dto/timetable.dto';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TimetableService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
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

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'create', timetableId: timetable.id });

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

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'update', timetableId: dto.id });

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

  async getStudentTimetableByQuery(userId: string, courseName?: string, divisionName?: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const where: any = {
      timetable: {
        collegeId: student.collegeId,
        active: true,
      },
    };

    if (divisionName) {
      where.division = {
        name: {
          contains: divisionName,
          mode: 'insensitive',
        },
      };
    } else {
      where.divisionId = student.divisionId;
    }

    if (courseName) {
      where.division = {
        ...where.division,
        semester: {
          academicSession: {
            course: {
              name: {
                contains: courseName,
                mode: 'insensitive',
              },
            },
          },
        },
      };
    }

    return this.prisma.timetableSlot.findMany({
      where,
      include: {
        subject: true,
        teacher: {
          include: {
            user: true,
          },
        },
        division: {
          include: {
            semester: {
              include: {
                academicSession: {
                  include: {
                    course: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
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

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'publish', timetableId: dto.timetableId, version });
    this.eventsGateway.broadcast('timetable:published', { timetableId: dto.timetableId, version });

    // Notify all students in the timetable's division
    try {
      const timetableWithDivision = await this.prisma.timetable.findUnique({
        where: { id: dto.timetableId },
        select: { divisionId: true },
      });
      if (timetableWithDivision?.divisionId) {
        const students = await this.prisma.student.findMany({
          where: { divisionId: timetableWithDivision.divisionId, status: 'ACTIVE' },
          select: { userId: true },
        });
        for (const student of students) {
          this.notificationsService.sendNotification({
            recipientId: student.userId,
            title: 'Timetable Updated',
            body: 'Your class timetable has been updated. Please check the new schedule.',
            type: 'IN_APP',
            link: '/dashboard/student/timetable',
          }).catch(() => { /* Non-blocking */ });
        }
      }
    } catch (e) {
      // Non-blocking: never fail timetable publish due to notification error
    }

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

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'substitute', substituteId: substitute.id });

    return substitute;
  }

  async getHistory(timetableId: string) {
    return this.prisma.timetableHistory.findMany({
      where: { timetableId },
      orderBy: { changedAt: 'desc' },
    });
  }

  async saveAllTimetableEntries(entries: any[], collegeId: string, actorId: string, actorName: string, actorRole: string) {
    await this.prisma.timetableSlot.deleteMany({
      where: { timetable: { collegeId } }
    });
    await this.prisma.timetable.deleteMany({
      where: { collegeId }
    });

    if (entries.length === 0) {
      this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'save_all' });
      return [];
    }

    const defaultDept = await this.prisma.department.findFirst({ where: { collegeId } });
    const defaultCourse = await this.prisma.course.findFirst({ where: { department: { collegeId } } });
    const defaultSession = await this.prisma.academicSession.findFirst({ where: { course: { department: { collegeId } } } });
    const defaultSemester = await this.prisma.semester.findFirst({ where: { academicSession: { course: { department: { collegeId } } } } });
    const defaultDivision = await this.prisma.division.findFirst({ where: { semester: { academicSession: { course: { department: { collegeId } } } } } });

    if (!defaultDept || !defaultCourse || !defaultSession || !defaultSemester || !defaultDivision) {
      throw new BadRequestException('Academic structure (departments/courses/semesters/divisions) is not fully seeded.');
    }

    const divisions = await this.prisma.division.findMany({ where: { semester: { academicSession: { course: { department: { collegeId } } } } } });
    const subjects = await this.prisma.subject.findMany({ where: { department: { collegeId } } });
    const teachers = await this.prisma.teacher.findMany({ where: { collegeId }, include: { user: true } });

    const slotsByDivision: Record<string, any[]> = {};
    const daysOfWeekNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const matchedDiv = divisions.find(d => d.name.toLowerCase() === (entry.division || '').toLowerCase()) || defaultDivision;
      
      let matchedSub = subjects.find(s => s.code?.toLowerCase() === (entry.subjectCode || '').toLowerCase() || s.name.toLowerCase() === (entry.subject || '').toLowerCase());
      if (!matchedSub && entry.subject) {
        matchedSub = await this.prisma.subject.create({
          data: {
            code: entry.subjectCode || `SUB-${i}`,
            name: entry.subject,
            departmentId: defaultDept.id,
            courseId: defaultCourse.id,
          }
        });
      }

      const matchedTeacher = teachers.find(t => t.user.name.toLowerCase().includes((entry.teacher || '').toLowerCase()));
      const dayIndex = daysOfWeekNames.findIndex(d => d.toLowerCase() === (entry.day || '').toLowerCase());
      const dayOfWeekVal = dayIndex !== -1 ? dayIndex : 0;

      let startTime = '09:00';
      let endTime = '10:00';
      if (entry.timeSlot && entry.timeSlot.includes('-')) {
        const parts = entry.timeSlot.split('-');
        startTime = parts[0].trim();
        endTime = parts[1].trim();
      }

      if (!slotsByDivision[matchedDiv.id]) {
        slotsByDivision[matchedDiv.id] = [];
      }

      slotsByDivision[matchedDiv.id].push({
        dayOfWeek: dayOfWeekVal,
        slotNumber: slotsByDivision[matchedDiv.id].length + 1,
        startTime,
        endTime,
        subjectId: matchedSub?.id || null,
        teacherId: matchedTeacher?.id || null,
        divisionId: matchedDiv.id,
        room: entry.classroom || 'TBD',
        isPublished: true,
      });
    }

    const createdTimetables = [];
    for (const [divId, slots] of Object.entries(slotsByDivision)) {
      const divObj = divisions.find(d => d.id === divId)!;
      const semObj = await this.prisma.semester.findUnique({ where: { id: divObj.semesterId } });
      const sessObj = await this.prisma.academicSession.findUnique({ where: { id: semObj?.academicSessionId } });
      const courseObj = await this.prisma.course.findUnique({ where: { id: sessObj?.courseId } });

      const tt = await this.prisma.timetable.create({
        data: {
          collegeId,
          academicSessionId: sessObj?.id || defaultSession.id,
          departmentId: courseObj?.departmentId || defaultDept.id,
          courseId: courseObj?.id || defaultCourse.id,
          semesterId: semObj?.id || defaultSemester.id,
          divisionId: divId,
          active: true,
          slots: {
            create: slots
          }
        }
      });
      createdTimetables.push(tt);
    }

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Save Timetable Slots',
      `Saved ${entries.length} timetable slots across ${createdTimetables.length} timetables`,
      'timetable',
      'Timetable',
      createdTimetables[0]?.id || ''
    );

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'save_all' });
    this.eventsGateway.broadcast('timetable:published', { type: 'save_all' });

    return createdTimetables;
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

    this.eventsGateway.broadcast('TIMETABLE_UPDATED', { type: 'delete', timetableId: id });

    return deleted;
  }
}
