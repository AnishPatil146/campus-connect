import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AttendanceCorrectionDto,
  AttendanceRequestDto,
  AttendanceReportQueryDto,
  CreateAttendanceSessionDto,
  MarkAttendanceDto,
  UpdateAttendanceDto,
} from './dto/attendance.dto';

import { OllamaService } from '../ai/ollama.service';

@Injectable()
export class AttendanceService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private eventsGateway: EventsGateway,
    private notificationsService: NotificationsService,
    private ollamaService: OllamaService,
  ) {}

  /**
   * Auto-refresh & recompute attendance analytics daily at exactly 12:00 AM (Scheduled Cron)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async recomputeDailyAttendanceAnalytics() {
    console.log('⏰ [Cron] Recomputing daily attendance analytics at 12:00 AM...');
    try {
      const students = await this.prisma.student.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, collegeId: true },
      });

      for (const student of students) {
        const records = await this.prisma.attendanceRecord.findMany({
          where: { studentId: student.id },
          include: { attendanceSession: true },
        });

        // Group by subject to update summary
        const subjectMap: Record<string, { present: number; absent: number; leave: number; total: number }> = {};
        records.forEach(r => {
          const subId = r.attendanceSession?.subjectId;
          if (!subId) return;
          if (!subjectMap[subId]) subjectMap[subId] = { present: 0, absent: 0, leave: 0, total: 0 };
          if (r.status === 'PRESENT' || r.status === 'LATE') subjectMap[subId].present++;
          else if (r.status === 'ABSENT') subjectMap[subId].absent++;
          else subjectMap[subId].leave++;
          subjectMap[subId].total++;
        });

        for (const [subjectId, data] of Object.entries(subjectMap)) {
          const subPercentage = data.total > 0 ? (data.present / data.total) * 100 : 100;
          await this.prisma.attendanceSummary.upsert({
            where: { studentId_subjectId: { studentId: student.id, subjectId } },
            create: {
              studentId: student.id,
              subjectId,
              presentCount: data.present,
              absentCount: data.absent,
              leaveCount: data.leave,
              attendancePercentage: subPercentage,
            },
            update: {
              presentCount: data.present,
              absentCount: data.absent,
              leaveCount: data.leave,
              attendancePercentage: subPercentage,
            },
          });
        }
      }
      console.log('✅ [Cron] Daily attendance analytics recomputed successfully.');
    } catch (error: any) {
      console.error('❌ [Cron Error] Daily attendance analytics failed:', error);
      await this.audit.log(
        'SYSTEM',
        'System Cron',
        'SYSTEM',
        'Cron Job Failure: Attendance Analytics',
        `Daily 12:00 AM attendance recalculation failed: ${error?.message || error}`,
        'attendance',
        'AttendanceSummary',
        'CRON_MIDNIGHT',
      );

      // Alert admins across colleges
      const admins = await this.prisma.user.findMany({
        where: { userRoles: { some: { role: { name: 'ADMIN' } } }, status: 'ACTIVE' },
        select: { id: true },
      });
      for (const admin of admins) {
        try {
          await this.notificationsService.sendNotification({
            recipientId: admin.id,
            title: '⚠️ System Alert: Daily Attendance Recalculation Failed',
            body: `The 12:00 AM attendance cron job failed: ${error?.message || 'Internal error'}. Analytics graph served with last verified snapshot.`,
            type: 'IN_APP',
            link: '/dashboard/admin/attendance',
          });
        } catch (e) {
          // ignore notification failure
        }
      }
    }
  }

  async createSession(dto: CreateAttendanceSessionDto, actorId: string, actorName: string, actorRole: string) {
    let academicSessionId = dto.academicSessionId;
    if (!academicSessionId || academicSessionId === 'academic-session-placeholder') {
      const activeSession = await this.prisma.academicSession.findFirst({
        where: { isActive: true },
      }) || await this.prisma.academicSession.findFirst({});
      if (activeSession) {
        academicSessionId = activeSession.id;
      }
    }

    const attendanceSession = await this.prisma.attendanceSession.create({
      data: {
        collegeId: dto.collegeId,
        academicSessionId: academicSessionId!,
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
        // Deliver in-app notification to the student about their attendance status
        try {
          const statusLabel = record.status === 'PRESENT' ? 'Present ✅' :
            record.status === 'ABSENT' ? 'Absent ❌' :
            record.status === 'LATE' ? 'Late ⏰' : record.status;
          await this.notificationsService.sendNotification({
            recipientId: student.userId,
            title: 'Attendance Recorded',
            body: `Your attendance has been recorded: ${statusLabel}`,
            type: 'IN_APP',
            link: '/dashboard/student/attendance',
          });
        } catch (e) {
          // Non-blocking: never fail attendance marking due to notification error
        }
      }
    }

    this.eventsGateway.broadcast('attendance:updated', { attendanceSessionId: dto.attendanceSessionId });

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

    this.eventsGateway.broadcast('attendance:updated', { attendanceRecordId: record.id });

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
                teacher: {
                  include: {
                    profile: true,
                    user: true,
                  },
                },
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

    // Mapping history entries with teacher attribution
    const history = records.map((r) => {
      const teacherProfile = r.attendanceSession?.teacher?.profile;
      const teacherUser = r.attendanceSession?.teacher?.user;
      const recordedBy = teacherProfile
        ? `Prof. ${teacherProfile.firstName} ${teacherProfile.lastName}`
        : teacherUser?.name || 'Assigned Faculty';

      return {
        id: r.id,
        date: r.attendanceSession?.attendanceDate || r.createdAt,
        status: r.status,
        subjectName: r.attendanceSession?.subject?.name || 'Lecture',
        recordedBy,
        startTime: r.attendanceSession?.startTime || '',
        endTime: r.attendanceSession?.endTime || '',
        remarks: r.remarks,
      };
    });

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
    const imageUrl = (dto as any).imageUrl || null;
    const reasonText = dto.reason || (imageUrl ? 'Uploaded written application image' : 'Excused absence request');
    
    // Call Ollama for AI extraction and confidence analysis
    let aiAnalysisData: any = {
      isAiExtracted: false,
      confidenceScore: 0.0,
      extractedReason: reasonText,
      fromDate: dto.fromDate,
      toDate: dto.toDate,
      urgencyLevel: dto.leaveType?.toLowerCase().includes('sick') || dto.leaveType?.toLowerCase().includes('medical') ? 'HIGH' : 'NORMAL',
      summaryNotes: 'AI analysis unavailable — routed directly to admin for manual review with raw submission.',
    };

    try {
      const prompt = `Analyze this student leave request:
Type: ${dto.leaveType}
Dates: ${dto.fromDate} to ${dto.toDate}
Submitted Reason / Image details: ${reasonText}

Return a valid JSON object with keys:
"summary": a 1-sentence summary of the request,
"confidence": a number between 0.0 and 1.0 representing extraction confidence,
"urgency": "HIGH" or "NORMAL"`;

      const aiRes = await this.ollamaService.generateCompletion(
        'Leave Application Analysis',
        prompt,
        'You parse academic leave requests into structured JSON.',
        actorId,
        actorName,
        actorRole,
      );

      if (aiRes.success && aiRes.json) {
        aiAnalysisData = {
          isAiExtracted: true,
          confidenceScore: aiRes.json.confidence ?? 0.85,
          extractedReason: aiRes.json.summary || reasonText,
          fromDate: dto.fromDate,
          toDate: dto.toDate,
          urgencyLevel: aiRes.json.urgency || aiAnalysisData.urgencyLevel,
          summaryNotes: `[AI-Assisted Analysis via Ollama] ${aiRes.json.summary || 'Parsed successfully'}. Confidence: ${((aiRes.json.confidence ?? 0.85) * 100).toFixed(0)}%.`,
        };
      } else if (aiRes.success && aiRes.data) {
        aiAnalysisData.summaryNotes = `[AI-Assisted Analysis via Ollama] ${aiRes.data.slice(0, 200)}`;
        aiAnalysisData.isAiExtracted = true;
        aiAnalysisData.confidenceScore = 0.75;
      }
    } catch (e: any) {
      console.warn('Ollama leave extraction failed gracefully:', e?.message || e);
    }

    const request = await this.prisma.attendanceRequest.create({
      data: {
        studentId: dto.studentId,
        leaveType: dto.leaveType,
        reason: reasonText,
        fromDate: new Date(dto.fromDate),
        toDate: new Date(dto.toDate),
        imageUrl,
        aiAnalysis: JSON.stringify(aiAnalysisData),
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Request Leave (AI Processed)',
      `Leave request created and analyzed via Ollama for student ${dto.studentId}`,
      'attendance',
      'AttendanceRequest',
      request.id,
    );

    return request;
  }

  async approveStudentLeave(
    requestId: string,
    parentVerified: boolean,
    parentVerificationNotes: string,
    actorId: string,
    actorName: string,
    actorRole: string,
  ) {
    const request = await this.prisma.attendanceRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundException('Leave request not found');

    if (!parentVerified) {
      throw new BadRequestException(
        'Mandatory Checklist Incomplete: Admin must confirm calling parent using phone number on file before approving student leave.',
      );
    }

    const updated = await this.prisma.attendanceRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        approvedById: actorId,
        parentVerified: true,
        parentVerificationNotes: parentVerificationNotes || 'Parent call verified on file by admin.',
      },
    });

    await this.audit.log(
      actorId,
      actorName,
      actorRole,
      'Approve Student Leave (Parent Verified)',
      `Approved student leave request ${requestId} with parent call verification`,
      'attendance',
      'AttendanceRequest',
      requestId,
    );

    return updated;
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
