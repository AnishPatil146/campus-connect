import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendanceService', () => {
  let service: AttendanceService;

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
    },
    attendanceSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    attendanceRecord: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    attendanceHistory: {
      create: jest.fn(),
    },
    attendanceRequest: {
      create: jest.fn(),
    },
    attendanceCorrection: {
      create: jest.fn(),
    },
    attendanceReport: {
      findMany: jest.fn(),
    },
  };

  const mockAuditService = { log: jest.fn() };
  const mockEventsGateway = { broadcastToUser: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- createSession ---------------------------------------------------------

  describe('createSession', () => {
    const dto: any = {
      collegeId: 'college-uuid',
      academicSessionId: 'session-uuid',
      subjectId: 'subject-uuid',
      teacherId: 'teacher-uuid',
      semesterId: 'sem-uuid',
      divisionId: 'div-uuid',
      lectureNumber: 1,
      attendanceDate: '2024-01-15',
    };

    it('should create an attendance session and write audit log', async () => {
      const created = { id: 'att-session-uuid', ...dto };
      mockPrismaService.attendanceSession.create.mockResolvedValue(created);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.createSession(dto, 'actor-id', 'Teacher Name', 'TEACHER');

      expect(result.id).toBe('att-session-uuid');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        'actor-id',
        'Teacher Name',
        'TEACHER',
        'Create Attendance Session',
        expect.stringContaining('att-session-uuid'),
        expect.any(String),
        expect.any(String),
        expect.any(String),
      );
    });
  });

  // --- markAttendance --------------------------------------------------------

  describe('markAttendance', () => {
    it('should throw NotFoundException for missing session', async () => {
      mockPrismaService.attendanceSession.findUnique.mockResolvedValue(null);
      await expect(
        service.markAttendance({ attendanceSessionId: 'bad-id', records: [] } as any, 'id', 'Name', 'TEACHER'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session is not OPEN or DRAFT', async () => {
      mockPrismaService.attendanceSession.findUnique.mockResolvedValue({ id: 'sid', status: 'LOCKED', records: [] });
      await expect(
        service.markAttendance({ attendanceSessionId: 'sid', records: [] } as any, 'id', 'Name', 'TEACHER'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should upsert records and write audit log for OPEN session', async () => {
      mockPrismaService.attendanceSession.findUnique.mockResolvedValue({ id: 'sid', status: 'OPEN', records: [] });
      mockPrismaService.attendanceRecord.upsert.mockResolvedValue({ id: 'rec-1', status: 'PRESENT' });
      mockAuditService.log.mockResolvedValue(undefined);

      const dto: any = {
        attendanceSessionId: 'sid',
        records: [{ studentId: 'stu-1', status: 'PRESENT' }],
      };

      const result = await service.markAttendance(dto, 'actor-id', 'Teacher', 'TEACHER');
      expect(result).toHaveLength(1);
      expect(mockPrismaService.attendanceRecord.upsert).toHaveBeenCalledTimes(1);
    });
  });

  // --- Attendance % Formula --------------------------------------------------

  describe('Attendance Percentage Formula', () => {
    /**
     * Spec: Attendance % = (Present / Total Lectures) * 100
     * These tests validate the formula itself as a pure calculation.
     */
    const calculateAttendancePercentage = (present: number, total: number): number => {
      if (total === 0) return 0;
      return Math.round((present / total) * 100 * 100) / 100;
    };

    it('should return 100% when all lectures attended', () => {
      expect(calculateAttendancePercentage(30, 30)).toBe(100);
    });

    it('should return 0% when no lectures attended', () => {
      expect(calculateAttendancePercentage(0, 30)).toBe(0);
    });

    it('should return 75% for 3/4 attendance', () => {
      expect(calculateAttendancePercentage(75, 100)).toBe(75);
    });

    it('should return 0% when total lectures is 0 (no division by zero)', () => {
      expect(calculateAttendancePercentage(0, 0)).toBe(0);
    });

    it('should correctly calculate non-whole percentage', () => {
      expect(calculateAttendancePercentage(22, 30)).toBeCloseTo(73.33, 1);
    });
  });

  // --- getStudentAttendance -------------------------------------------------

  describe('getStudentAttendance', () => {
    it('should return attendance records for a student', async () => {
      mockPrismaService.attendanceRecord.findMany.mockResolvedValue([{ id: 'rec-1', status: 'PRESENT' }]);
      const result = await service.getStudentAttendance('student-uuid');
      expect(result).toHaveLength(1);
      expect(mockPrismaService.attendanceRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { studentId: 'student-uuid' } }),
      );
    });
  });

  // --- getStudentDashboardSummary --------------------------------------------

  describe('getStudentDashboardSummary', () => {
    it('should throw NotFoundException if student profile is not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      await expect(service.getStudentDashboardSummary('not-found-uid')).rejects.toThrow(NotFoundException);
    });

    it('should calculate correct metrics, trends, and history mapping', async () => {
      const mockStudent = {
        id: 'stu-id',
        userId: 'student-user-id',
        attendanceRecords: [
          {
            id: 'rec-1',
            status: 'PRESENT',
            remarks: 'On time',
            createdAt: new Date('2026-07-10T10:00:00Z'),
            attendanceSession: {
              attendanceDate: new Date('2026-07-10T10:00:00Z'),
              startTime: '10:00',
              endTime: '11:00',
              subject: {
                id: 'sub-dbms',
                name: 'DBMS',
              },
            },
          },
          {
            id: 'rec-2',
            status: 'ABSENT',
            remarks: 'Late',
            createdAt: new Date('2026-07-11T10:00:00Z'),
            attendanceSession: {
              attendanceDate: new Date('2026-07-11T10:00:00Z'),
              startTime: '10:00',
              endTime: '11:00',
              subject: {
                id: 'sub-dbms',
                name: 'DBMS',
              },
            },
          },
        ],
      };

      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.getStudentDashboardSummary('student-user-id');

      expect(result.percentage).toBe(50);
      expect(result.present).toBe(1);
      expect(result.absent).toBe(1);
      expect(result.monthlyTrend).toHaveLength(1);
      expect(result.monthlyTrend[0]).toEqual({ month: 'Jul', percentage: 50 });
      expect(result.subjectWise).toHaveLength(1);
      expect(result.subjectWise[0]).toEqual({
        subjectId: 'sub-dbms',
        subjectName: 'DBMS',
        present: 1,
        absent: 1,
        percentage: 50,
      });
      expect(result.history).toHaveLength(2);
    });
  });
});
