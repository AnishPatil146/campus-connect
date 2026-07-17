import { Test, TestingModule } from '@nestjs/testing';
import { NotesService } from './notes.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EventsGateway } from '../events/events.gateway';
import { NotFoundException } from '@nestjs/common';

describe('NotesService', () => {
  let service: NotesService;

  const mockPrismaService = {
    teacher: {
      findUnique: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    note: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    noteCategory: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    subject: {
      findFirst: jest.fn(),
    },
    semester: {
      findFirst: jest.fn(),
    },
    division: {
      findFirst: jest.fn(),
    },
  };

  const mockAuditService = { log: jest.fn() };
  const mockEventsGateway = { broadcast: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotesService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<NotesService>(NotesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findTeacherProfileByUserId', () => {
    it('should throw NotFoundException if teacher is not found', async () => {
      mockPrismaService.teacher.findUnique.mockResolvedValue(null);
      await expect(service.findTeacherProfileByUserId('bad-uid')).rejects.toThrow(NotFoundException);
    });

    it('should return teacher profile if found', async () => {
      const mockTeacher = { id: 'teacher-1', userId: 'user-1' };
      mockPrismaService.teacher.findUnique.mockResolvedValue(mockTeacher);
      const result = await service.findTeacherProfileByUserId('user-1');
      expect(result).toEqual(mockTeacher);
    });
  });

  describe('getNotesForStudent', () => {
    it('should throw NotFoundException if student is not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);
      await expect(service.getNotesForStudent('bad-uid')).rejects.toThrow(NotFoundException);
    });

    it('should return published notes scoped to student division/semester/public', async () => {
      const mockStudent = { id: 'student-1', userId: 'user-1', divisionId: 'div-1', semesterId: 'sem-1' };
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.note.findMany.mockResolvedValue([{ id: 'note-1', status: 'PUBLISHED' }]);

      const result = await service.getNotesForStudent('user-1');
      expect(result).toHaveLength(1);
      expect(mockPrismaService.note.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PUBLISHED',
            OR: expect.arrayContaining([
              { divisionId: 'div-1' },
              { semesterId: 'sem-1' },
              { visibility: 'PUBLIC' },
            ]),
          }),
        }),
      );
    });
  });

  describe('createFromNames', () => {
    it('should create note, log audit, and broadcast noteUploaded event', async () => {
      const mockCategory = { id: 'cat-1', name: 'Study Materials' };
      const mockSubject = { id: 'sub-1', name: 'Database Management Systems' };
      const mockSemester = { id: 'sem-1', name: 'Semester 1' };
      const mockDivision = { id: 'div-1', name: 'Division A' };
      const mockNote = { id: 'note-1', title: 'DBMS Note', status: 'PUBLISHED' };

      mockPrismaService.noteCategory.findFirst.mockResolvedValue(mockCategory);
      mockPrismaService.subject.findFirst.mockResolvedValue(mockSubject);
      mockPrismaService.semester.findFirst.mockResolvedValue(mockSemester);
      mockPrismaService.division.findFirst.mockResolvedValue(mockDivision);
      mockPrismaService.note.create.mockResolvedValue(mockNote);
      mockPrismaService.note.findUnique.mockResolvedValue(mockNote);

      const result = await service.createFromNames(
        { title: 'DBMS Note', subject: 'DBMS', semester: 1, division: 'Division A', status: 'PUBLISHED' },
        'teacher-1',
        'Sarah Jenkins',
      );

      expect(result).toEqual(mockNote);
      expect(mockPrismaService.note.create).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
      expect(mockEventsGateway.broadcast).toHaveBeenCalledWith('noteUploaded', mockNote);
    });
  });
});
