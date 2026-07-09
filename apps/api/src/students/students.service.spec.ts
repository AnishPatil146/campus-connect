import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockStudent = {
    id: 'student-uuid',
    userId: 'user-uuid',
    collegeId: 'college-uuid',
    rollNumber: 'CS-2024-101',
    admissionNo: 'ADM-COLL-123456',
    status: 'ACTIVE',
    deletedAt: null,
    createdAt: new Date(),
    user: { id: 'user-uuid', email: 'student@college.edu', name: 'Test Student', createdAt: new Date() },
    profile: null,
    guardians: [],
    addresses: [],
    medical: null,
    promotions: [],
    logins: [],
    statusHistories: [],
    division: null,
  };

  const mockPrismaService = {
    student: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    studentStatusHistory: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockEventsGateway = {
    broadcast: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- findAll ----------------------------------------------------------------

  describe('findAll', () => {
    it('should return all active students for a college', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([mockStudent]);
      const result = await service.findAll('college-uuid');
      expect(result).toHaveLength(1);
      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ collegeId: 'college-uuid', status: 'ACTIVE' }),
        }),
      );
    });

    it('should filter by search term', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([mockStudent]);
      await service.findAll('college-uuid', { search: 'Test' });
      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        }),
      );
    });

    it('should return empty array when no students found', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([]);
      const result = await service.findAll('college-uuid');
      expect(result).toEqual([]);
    });
  });

  // --- findOne ----------------------------------------------------------------

  describe('findOne', () => {
    it('should return a student by ID', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      const result = await service.findOne('student-uuid');
      expect(result.id).toBe('student-uuid');
    });

    it('should throw NotFoundException for missing student', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when college ID does not match', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      await expect(service.findOne('student-uuid', 'wrong-college')).rejects.toThrow(BadRequestException);
    });
  });

  // --- create -----------------------------------------------------------------

  describe('create', () => {
    const createDto: any = {
      email: 'new@college.edu',
      name: 'New Student',
      firstName: 'New',
      lastName: 'Student',
      gender: 'MALE',
      dateOfBirth: '2000-01-01',
      collegeId: 'college-uuid',
      departmentId: 'dept-uuid',
      courseId: 'course-uuid',
      semesterId: 'sem-uuid',
      divisionId: 'div-uuid',
      academicSessionId: 'session-uuid',
    };

    it('should throw BadRequestException if email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing' });
      await expect(
        service.create(createDto, 'college-uuid', 'admin-id', 'Admin', 'ADMIN'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should broadcast student.created event on success', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.$transaction.mockResolvedValue({ id: 'new-student-uuid' });

      await service.create(createDto, 'college-uuid', 'admin-id', 'Admin', 'ADMIN');
      expect(mockEventsGateway.broadcast).toHaveBeenCalledWith(
        'student.created',
        expect.objectContaining({ id: 'new-student-uuid' }),
      );
    });
  });
});
