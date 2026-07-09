import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export interface GenerateReportDto {
  reportType: string; // "ATTENDANCE" | "STUDENT" | "TEACHER" | "ASSIGNMENT" | "EVENT" | "NOTES"
  filters?: {
    academicYear?: string;
    departmentId?: string;
    courseId?: string;
    semesterId?: string;
    divisionId?: string;
    startDate?: string;
    endDate?: string;
  };
}

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async generateReport(dto: GenerateReportDto, userId: string, actorName: string, actorRole: string) {
    // Generate some mock report statistics based on type
    let dataSummary = {};

    if (dto.reportType === 'ATTENDANCE') {
      const presentCount = await this.prisma.attendanceRecord.count({ where: { status: 'PRESENT' } });
      const absentCount = await this.prisma.attendanceRecord.count({ where: { status: 'ABSENT' } });
      dataSummary = { presentCount, absentCount, rate: presentCount + absentCount > 0 ? (presentCount / (presentCount + absentCount)) * 100 : 100 };
    } else if (dto.reportType === 'STUDENT') {
      const activeStudents = await this.prisma.student.count({ where: { status: 'ACTIVE' } });
      dataSummary = { activeStudents };
    } else if (dto.reportType === 'TEACHER') {
      const activeTeachers = await this.prisma.teacher.count({ where: { status: 'ACTIVE' } });
      dataSummary = { activeTeachers };
    } else if (dto.reportType === 'ASSIGNMENT') {
      const totalAssignments = await this.prisma.assignment.count();
      const submittedCount = await this.prisma.submission.count({ where: { status: 'SUBMITTED' } });
      dataSummary = { totalAssignments, submittedCount };
    } else {
      dataSummary = { generatedAt: new Date().toISOString() };
    }

    const report = await this.prisma.attendanceReport.create({
      data: {
        reportType: dto.reportType,
        generatedById: userId,
        reportData: JSON.stringify(dataSummary),
      },
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'GENERATE_REPORT',
      `Generated ${dto.reportType} report`,
      'reports',
      'AttendanceReport',
      report.id,
    );

    return report;
  }

  async findAll(userId: string) {
    return this.prisma.attendanceReport.findMany({
      where: { generatedById: userId },
      orderBy: { generatedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const report = await this.prisma.attendanceReport.findUnique({
      where: { id },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async download(id: string, userId: string, actorName: string, actorRole: string) {
    const report = await this.findOne(id);

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'DOWNLOAD_REPORT',
      `Downloaded report ${id}`,
      'reports',
      'AttendanceReport',
      id,
    );

    return {
      id: report.id,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      downloadUrl: `https://storage.campusconnect.com/reports/${report.id}.pdf`,
      data: JSON.parse(report.reportData || '{}'),
    };
  }

  async remove(id: string, userId: string, actorName: string, actorRole: string) {
    await this.findOne(id);

    const deleted = await this.prisma.attendanceReport.delete({
      where: { id },
    });

    await this.audit.log(
      userId,
      actorName,
      actorRole,
      'DELETE_REPORT',
      `Deleted report ${id}`,
      'reports',
      'AttendanceReport',
      id,
    );

    return deleted;
  }
}
