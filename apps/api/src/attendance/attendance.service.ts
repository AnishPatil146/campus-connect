import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import {
  AttendanceCorrectionDto,
  AttendanceRequestDto,
  AttendanceReportQueryDto,
  CreateAttendanceSessionDto,
  MarkAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private eventsGateway: EventsGateway,
  ) {}

  async createSession(dto: CreateAttendanceSessionDto, actorId: string, actorName: string, actorRole: string) {
    const attendanceSession = await this.prisma.attendanceSession.create({
      data: {
        collegeId: dto.collegeId,
        academicSessionId: dto.academicSessionId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        semesterId: dto.semesterId,
        divisionId: dto.divisionId,
        classroomId: dto.classroomId || null,
        lectureNumber: dto.lectureNumber,
        attendanceDate: new Date(dto.attendanceDate),
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Create Attendance Session',
      `Created attendance session ${attendanceSession.id}`,
      'attendance',
      'AttendanceSession',
      attendanceSession.id,
    );

    return attendanceSession;
  }

  async findSessions(filters: { divisionId?: string; teacherId?: string; date?: string }) {
    const where: any = {};
    if (filters.divisionId) where.divisionId = filters.divisionId;
    if (filters.teacherId) where.teacherId = filters.teacherId;
    if (filters.date) where.attendanceDate = new Date(filters.date);

    return this.prisma.attendanceSession.findMany({
      where,
      include: {
        subject: true,
        teacher: true,
        division: true,
        records: true,
      },
      orderBy: { attendanceDate: 'desc' },
    });
  }

  async markAttendance(dto: MarkAttendanceDto, actorId: string, actorName: string, actorRole: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: dto.attendanceSessionId },
      include: { records: true },
    });

    if (!session) throw new NotFoundException('Attendance session not found');
    if (session.status !== 'OPEN' && session.status !== 'DRAFT') {
      throw new BadRequestException('Attendance can only be marked in open or draft sessions');
    }

    const records = await Promise.all(dto.records.map((record) =>
      this.prisma.attendanceRecord.upsert({
        where: {
          attendanceSessionId_studentId: {
            attendanceSessionId: dto.attendanceSessionId,
            studentId: record.studentId,
          },
        },
        create: {
          attendanceSessionId: dto.attendanceSessionId,
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks || null,
          markedById: actorId,
          markedAt: new Date(),
        },
        update: {
          status: record.status,
          remarks: record.remarks || null,
          markedById: actorId,
          markedAt: new Date(),
        },
      }),
    ));

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Mark Attendance',
      `Marked attendance for session ${dto.attendanceSessionId}`,
      'attendance',
      'AttendanceSession',
      dto.attendanceSessionId,
    );

    // Emit live WebSocket updates to each student marked
    for (const record of records) {
      const student = await this.prisma.student.findUnique({
        where: { id: record.studentId },
        select: { userId: true },
      });
      if (student && student.userId) {
        try {
          const summary = await this.getStudentDashboardSummary(student.userId);
          this.eventsGateway.broadcastToUser(student.userId, 'attendanceUpdate', summary);
        } catch (e) {
          // ignore
        }
      }
    }

    return records;
  }

  async updateAttendance(dto: UpdateAttendanceDto, actorId: string, actorName: string, actorRole: string) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id: dto.recordId } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: dto.recordId },
      data: {
        status: dto.status,
        remarks: dto.remarks || record.remarks,
        markedById: actorId,
        markedAt: new Date(),
      },
    });

    await this.prisma.attendanceHistory.create({
      data: {
        attendanceRecordId: record.id,
        oldStatus: record.status,
        newStatus: dto.status,
        changedById: actorId,
        reason: dto.remarks || 'Attendance update',
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Update Attendance',
      `Updated attendance record ${record.id}`,
      'attendance',
      'AttendanceRecord',
      record.id,
    );

    // Emit live WebSocket update to the student
    const student = await this.prisma.student.findUnique({
      where: { id: updated.studentId },
      select: { userId: true },
    });
    if (student && student.userId) {
      try {
        const summary = await this.getStudentDashboardSummary(student.userId);
        this.eventsGateway.broadcastToUser(student.userId, 'attendanceUpdate', summary);
      } catch (e) {
        // ignore
      }
    }

    return updated;
  }

  async getStudentAttendance(studentId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { attendanceSession: true },
      orderBy: { markedAt: 'desc' },
    });
  }

  async getStudentDashboardSummary(studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        attendanceRecords: {
          include: {
            attendanceSession: {
              include: {
                subject: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const records = student.attendanceRecords;
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;

    records.forEach((r) => {
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        presentCount++;
      } else if (r.status === 'ABSENT') {
        absentCount++;
      } else {
        excusedCount++;
      }
    });

    const total = presentCount + absentCount;
    const percentage = total > 0 ? Math.round((presentCount / total) * 100) : 100;

    // Monthly Trend calculation grouping
    const monthlyGroups: Record<string, { present: number; total: number }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    records.forEach((r) => {
      if (!r.attendanceSession) return;
      const date = new Date(r.attendanceSession.attendanceDate);
      const monthStr = monthNames[date.getMonth()];
      if (!monthlyGroups[monthStr]) {
        monthlyGroups[monthStr] = { present: 0, total: 0 };
      }
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        monthlyGroups[monthStr].present++;
      }
      if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'ABSENT') {
        monthlyGroups[monthStr].total++;
      }
    });

    const monthlyTrend = Object.entries(monthlyGroups).map(([month, data]) => ({
      month,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
    }));

    // Subject-wise attendance calculation grouping
    const subjectGroups: Record<string, { subjectName: string; present: number; total: number }> = {};
    records.forEach((r) => {
      if (!r.attendanceSession || !r.attendanceSession.subject) return;
      const sub = r.attendanceSession.subject;
      if (!subjectGroups[sub.id]) {
        subjectGroups[sub.id] = { subjectName: sub.name, present: 0, total: 0 };
      }
      if (r.status === 'PRESENT' || r.status === 'LATE') {
        subjectGroups[sub.id].present++;
      }
      if (r.status === 'PRESENT' || r.status === 'LATE' || r.status === 'ABSENT') {
        subjectGroups[sub.id].total++;
      }
    });

    const subjectWise = Object.entries(subjectGroups).map(([subjectId, data]) => ({
      subjectId,
      subjectName: data.subjectName,
      present: data.present,
      absent: data.total - data.present,
      percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 100,
    }));

    // Mapping history entries
    const history = records.map((r) => ({
      id: r.id,
      date: r.attendanceSession?.attendanceDate || r.createdAt,
      status: r.status,
      subjectName: r.attendanceSession?.subject?.name || 'Lecture',
      startTime: r.attendanceSession?.startTime || '',
      endTime: r.attendanceSession?.endTime || '',
      remarks: r.remarks,
    }));

    return {
      percentage,
      present: presentCount,
      absent: absentCount,
      monthlyTrend,
      subjectWise,
      history,
    };
  }

  async getClassAttendance(attendanceSessionId: string) {
    return this.prisma.attendanceRecord.findMany({
      where: { attendanceSessionId },
      include: { student: true },
    });
  }

  async requestLeave(dto: AttendanceRequestDto, actorId: string, actorName: string, actorRole: string) {
    const request = await this.prisma.attendanceRequest.create({
      data: {
        studentId: dto.studentId,
        leaveType: dto.leaveType,
        reason: dto.reason || null,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Request Leave',
      `Leave request created for student ${dto.studentId}`,
      'attendance',
      'AttendanceRequest',
      request.id,
    );

    return request;
  }

  async requestCorrection(dto: AttendanceCorrectionDto, actorId: string, actorName: string, actorRole: string) {
    const record = await this.prisma.attendanceRecord.findUnique({ where: { id: dto.attendanceRecordId } });
    if (!record) throw new NotFoundException('Attendance record not found');

    const correction = await this.prisma.attendanceCorrection.create({
      data: {
        studentId: record.studentId,
        attendanceRecordId: record.id,
        requestedById: actorId,
        reason: dto.reason,
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Request Correction',
      `Correction requested for attendance record ${record.id}`,
      'attendance',
      'AttendanceCorrection',
      correction.id,
    );

    return correction;
  }

  async getReports(query: AttendanceReportQueryDto) {
    const where: any = {};
    if (query.studentId) where.generatedById = query.studentId;
    if (query.startDate || query.endDate) {
      where.generatedAt = {} as any;
      if (query.startDate) where.generatedAt.gte = new Date(query.startDate);
      if (query.endDate) where.generatedAt.lte = new Date(query.endDate);
    }

    return this.prisma.attendanceReport.findMany({ where, orderBy: { generatedAt: 'desc' } });
  }
}
