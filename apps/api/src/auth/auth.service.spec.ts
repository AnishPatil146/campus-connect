import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RedisService } from '../redis/redis.service';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findUnique: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
    },
    loginHistory: {
      create: jest.fn(),
    },
    session: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  const mockRedisService = {
    setSession: jest.fn().mockResolvedValue(undefined),
    getSession: jest.fn().mockResolvedValue(undefined),
    deleteSession: jest.fn().mockResolvedValue(undefined),
    setOtp: jest.fn().mockResolvedValue(undefined),
    getOtp: jest.fn().mockResolvedValue(undefined),
    deleteOtp: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: AuditService, useValue: mockAuditService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const passwordHash = bcrypt.hashSync('Password@123', 10);
    const mockUser = {
      id: 'user-uuid',
      email: 'student@college.edu',
      passwordHash,
      name: 'Test Student',
      status: 'ACTIVE',
      failedLoginAttempts: 0,
      lockedUntil: null,
      mustChangePassword: false,
      collegeId: 'college-uuid',
      userRoles: [
        {
          role: {
            name: 'STUDENT',
          },
        },
      ],
    };

    it('should login successfully with correct credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.session.create.mockResolvedValue({ id: 'session-uuid' });
      mockPrismaService.refreshToken.create.mockResolvedValue({ id: 'token-uuid' });

      const result = await service.login({
        email: 'student@college.edu',
        password: 'Password@123',
      });

      expect(result.needsWorkspaceSelection).toBe(false);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.user.email).toBe('student@college.edu');
    });

    it('should throw AUTH_001 for invalid password', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({});
      mockPrismaService.loginHistory.create.mockResolvedValue({});

      await expect(
        service.login({
          email: 'student@college.edu',
          password: 'WrongPassword123',
        }),
      ).rejects.toThrow(
        new UnauthorizedException({
          message: 'Invalid credentials',
          errorCode: 'AUTH_001',
        }),
      );
    });

    it('should throw AUTH_002 if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 15 * 60000),
      };
      mockPrismaService.user.findUnique.mockResolvedValue(lockedUser);

      await expect(
        service.login({
          email: 'student@college.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(
        new UnauthorizedException({
          message: 'Account is temporarily locked. Try again in 15 minutes.',
          errorCode: 'AUTH_002',
        }),
      );
    });

    it('should throw AUTH_003 if account is suspended', async () => {
      const suspendedUser = {
        ...mockUser,
        status: 'SUSPENDED',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(suspendedUser);

      await expect(
        service.login({
          email: 'student@college.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(
        new UnauthorizedException({
          message: 'Your account is suspended. Please contact your administrator.',
          errorCode: 'AUTH_003',
        }),
      );
    });

    it('should throw AUTH_004 if email is not verified', async () => {
      const unverifiedUser = {
        ...mockUser,
        status: 'PENDING_VERIFICATION',
      };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);

      await expect(
        service.login({
          email: 'student@college.edu',
          password: 'Password@123',
        }),
      ).rejects.toThrow(
        new UnauthorizedException({
          message: 'Email not verified. Please verify your email.',
          errorCode: 'AUTH_004',
        }),
      );
    });
  });
});
