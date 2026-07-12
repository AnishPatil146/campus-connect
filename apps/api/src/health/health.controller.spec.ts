import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $connect: jest.fn().mockResolvedValue(undefined),
        $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
        $disconnect: jest.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

jest.mock('cloudinary', () => {
  return {
    v2: {
      api: {
        ping: jest.fn().mockResolvedValue({ status: 'ok' }),
      },
    },
  };
});

describe('HealthController', () => {
  let controller: HealthController;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockRedisService = {
    ping: jest.fn(),
  };

  beforeEach(async () => {
    process.env.COLLEGE_A_DATABASE_URL = 'postgresql://localhost:5432/mock';
    process.env.COLLEGE_B_DATABASE_URL = 'postgresql://localhost:5432/mock';
    process.env.COLLEGE_C_DATABASE_URL = 'postgresql://localhost:5432/mock';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // --- General Health -------------------------------------------------------

  describe('GET /health', () => {
    it('should return status UP with api service', async () => {
      mockRedisService.ping.mockResolvedValue({ status: 'UP', latencyMs: 1 });
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.getGeneralHealth();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('UP');
      expect(result.data.services.api).toBe('UP');
      expect(result.data.timestamp).toBeDefined();
    });
  });

  // --- Database Health -----------------------------------------------------

  describe('GET /health/database', () => {
    it('should return CONNECTED when DB ping succeeds', async () => {
      mockPrismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
      const result = await controller.getDatabaseHealth();
      expect(result.status).toBe('UP');
      expect(result.database).toBe('CONNECTED');
    });

    it('should return DISCONNECTED when DB ping fails', async () => {
      mockPrismaService.$queryRaw.mockRejectedValue(new Error('Connection refused'));
      const result = await controller.getDatabaseHealth();
      expect(result.status).toBe('DOWN');
      expect((result as any).database).toBe('DISCONNECTED');
      expect((result as any).error).toBe('Connection refused');
    });
  });

  // --- Redis Health ---------------------------------------------------------

  describe('GET /health/redis', () => {
    it('should return CONNECTED with latency when Redis ping succeeds', async () => {
      mockRedisService.ping.mockResolvedValue({ status: 'UP', latencyMs: 3 });
      const result = await controller.getRedisHealth();
      expect(result.status).toBe('UP');
      expect(result.redis).toBe('CONNECTED');
      expect((result as any).latencyMs).toBe(3);
    });

    it('should return DISCONNECTED when Redis ping fails', async () => {
      mockRedisService.ping.mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await controller.getRedisHealth();
      expect(result.status).toBe('DOWN');
      expect((result as any).redis).toBe('DISCONNECTED');
      expect((result as any).error).toContain('ECONNREFUSED');
    });
  });
});
