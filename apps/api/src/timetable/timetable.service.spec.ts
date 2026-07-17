import { Test, TestingModule } from '@nestjs/testing';
import { TimetableService } from './timetable.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('TimetableService', () => {
  let service: TimetableService;

  const mockPrismaService = {
    student: {
      findUnique: jest.fn(),
    },
    timetable: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    timetableSlot: {
      findMany: jest.fn(),
    },
    timetablePublish: {
      create: jest.fn(),
      count: jest.fn(),
    },
    substituteTeacher: {
      create: jest.fn(),
    },
    timetableHistory: {
      findMany: jest.fn(),
    },
  };

  const mockAuditService = { log: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimetableService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<TimetableService>(TimetableService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentTimetableByQuery', () => {
    it('should throw NotFoundException if student profile is not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      await expect(service.getStudentTimetableByQuery('bad-uid')).rejects.toThrow(NotFoundException);
    });

    it('should return timetable slots for student division when no queries are passed', async () => {
      const mockStudent = { id: 'stu-id', userId: 'stu-user', collegeId: 'coll-id', divisionId: 'div-id' };
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.timetableSlot.findMany.mockResolvedValue([{ id: 'slot-1', divisionId: 'div-id' }]);

      const result = await service.getStudentTimetableByQuery('stu-user');

      expect(result).toHaveLength(1);
      expect(mockPrismaService.timetableSlot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            divisionId: 'div-id',
          }),
        }),
      );
    });

    it('should apply courseName and divisionName filter filters', async () => {
      const mockStudent = { id: 'stu-id', userId: 'stu-user', collegeId: 'coll-id', divisionId: 'div-id' };
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.timetableSlot.findMany.mockResolvedValue([]);

      await service.getStudentTimetableByQuery('stu-user', 'BSc IT', 'Division A');

      expect(mockPrismaService.timetableSlot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            division: expect.objectContaining({
              name: {
                contains: 'Division A',
                mode: 'insensitive',
              },
              semester: {
                academicSession: {
                  course: {
                    name: {
                      contains: 'BSc IT',
                      mode: 'insensitive',
                    },
                  },
                },
              },
            }),
          }),
        }),
      );
    });
  });
});
