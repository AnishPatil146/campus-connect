import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { AuditService } from './audit/audit.service';
import { RedisService } from './redis/redis.service';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import bcrypt from 'bcryptjs';

/**
 * Auth E2E Tests — uses Supertest to spin up the full NestJS app
 * with mocked PrismaService and RedisService (no real DB/Redis needed).
 */
describe('Auth API (e2e)', () => {
  let app: INestApplication;

  const passwordHash = bcrypt.hashSync('Password@123', 10);

  const activeUser = {
    id: 'user-uuid',
    email: 'student@college.edu',
    passwordHash,
    name: 'Test Student',
    status: 'ACTIVE',
    failedLoginAttempts: 0,
    lockedUntil: null,
    mustChangePassword: false,
    collegeId: 'college-uuid',
    lastLogin: null,
    userRoles: [{ role: { name: 'STUDENT' } }],
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    loginHistory: { create: jest.fn().mockResolvedValue({}) },
    session: {
      create: jest.fn().mockResolvedValue({ id: 'session-uuid' }),
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      deleteMany: jest.fn().mockResolvedValue({}),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({ id: 'token-uuid', device: 'Unknown', browser: 'Unknown', ipAddress: null }),
      update: jest.fn().mockResolvedValue({}),
      deleteMany: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
    },
    otpCode: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    student: {
      findUnique: jest.fn(),
    },
    teacher: {
      findUnique: jest.fn(),
    },
  };

  const mockAudit = { log: jest.fn().mockResolvedValue(undefined) };

  const mockRedis = {
    setSession: jest.fn().mockResolvedValue(undefined),
    deleteSession: jest.fn().mockResolvedValue(undefined),
    setOtp: jest.fn().mockResolvedValue(undefined),
    getOtp: jest.fn().mockResolvedValue(undefined),
    deleteOtp: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue(undefined),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue({ status: 'UP', latencyMs: 1 }),
    incrementAndGet: jest.fn().mockResolvedValue(1),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .overrideProvider(AuditService)
      .useValue(mockAudit)
      .overrideProvider(RedisService)
      .useValue(mockRedis)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.useGlobalInterceptors(new TransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Re-apply default mocks after clear
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.loginHistory.create.mockResolvedValue({});
    mockPrisma.session.create.mockResolvedValue({ id: 'session-uuid' });
    mockPrisma.refreshToken.create.mockResolvedValue({ id: 'token-uuid', device: 'Unknown', browser: 'Unknown', ipAddress: null });
    mockPrisma.refreshToken.update.mockResolvedValue({});
    mockAudit.log.mockResolvedValue(undefined);
    mockRedis.setSession.mockResolvedValue(undefined);
    mockPrisma.student.findUnique.mockResolvedValue({ id: 'student-uuid', userId: 'user-uuid' });
    mockPrisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-uuid', userId: 'user-uuid' });
  });

  // --- Health ----------------------------------------------------------------

  describe('GET /api/v1/health', () => {
    it('should return 200 with status UP', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.status).toBe('UP');
        });
    });
  });

  // --- Login Happy Path ------------------------------------------------------

  describe('POST /api/v1/auth/login', () => {
    it('AUTH_HAPPY_001: should return 200 with JWT tokens for valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'Password@123' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('student@college.edu');
    });

    // --- Negative Cases ----------------------------------------------------

    it('AUTH_NEG_001: should return 401 for wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'WrongPassword!' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid credentials');
    });

    it('AUTH_NEG_002: should return 401 for non-existent email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@college.edu', password: 'Password@123' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('AUTH_NEG_003: should return 401 for locked account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        lockedUntil: new Date(Date.now() + 15 * 60000),
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'Password@123' })
        .expect(401);

      expect(response.body.message).toContain('locked');
    });

    it('AUTH_NEG_004: should return 401 for suspended account', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...activeUser, status: 'SUSPENDED' });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'Password@123' })
        .expect(401);

      expect(response.body.message).toContain('suspended');
    });

    it('AUTH_NEG_005: should return 400 for missing email field', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ password: 'Password@123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('AUTH_NEG_006: should return 400 for invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'not-an-email', password: 'Password@123' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Login Locking Progression & Google Login E2E', () => {
    beforeEach(() => {
      mockRedis.incrementAndGet.mockResolvedValue(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        failedLoginAttempts: 4,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'WrongPassword!' })
        .expect(401);

      expect(response.body.message).toContain('locked');
    });

    it('should suspend account after 20 failed attempts', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...activeUser,
        failedLoginAttempts: 19,
      });

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'WrongPassword!' })
        .expect(401);

      expect(response.body.message).toContain('suspended');
    });

    it('should allow Google login with mock token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({
          token: 'mock-google-token-student@college.edu',
          collegeId: 'college-uuid',
          role: 'STUDENT',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should deny Google login on role mismatch', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(activeUser);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/google')
        .send({
          token: 'mock-google-token-student@college.edu',
          collegeId: 'college-uuid',
          role: 'TEACHER',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role mismatch');
    });

    it('should reject requests on role-specific rate limits', async () => {
      mockRedis.incrementAndGet.mockResolvedValue(10); // Exceeds threshold

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'student@college.edu', password: 'Password@123' })
        .expect(400);

      expect(response.body.message).toContain('Too many login attempts');
    });
  });
});

