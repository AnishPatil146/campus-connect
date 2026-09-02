import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';
import { Request } from 'express';

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => {
      return {
        $connect: jest.fn().mockResolvedValue(undefined),
        $queryRawUnsafe: jest.fn().mockResolvedValue([{ ping: 1 }]),
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
    $queryRawUnsafe: jest.fn(),
  };

  const mockRequest = {
    url: '/health',
  } as Request;

  beforeEach(async () => {
    process.env.DATABASE_URL = 'postgresql://neondb_owner:pass@ep-mock.aws.neon.tech/neondb?sslmode=require';

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: PrismaService, useValue: mockPrismaService },
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
    it('should return status UP with system services', async () => {
      const result = await controller.getGeneralHealth(mockRequest);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('UP');
      expect(result.data.services.api).toBe('UP');
      expect(result.data.services.database).toBe('UP');
      expect(result.data.timestamp).toBeDefined();
    });
  });

  // --- Database Health -----------------------------------------------------

  describe('GET /health/database', () => {
    it('should return CONNECTED when DB ping succeeds', async () => {
      mockPrismaService.$queryRawUnsafe.mockResolvedValue([{ ping: 1 }]);
      const result = await controller.getDatabaseHealth(mockRequest);
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('UP');
      expect(result.data.database).toBe('CONNECTED');
    });

    it('should return DISCONNECTED when DB ping fails', async () => {
      mockPrismaService.$queryRawUnsafe.mockRejectedValue(new Error('Connection refused'));
      const result = await controller.getDatabaseHealth(mockRequest);
      expect(result.success).toBe(false);
      expect(result.data.status).toBe('DOWN');
      expect(result.data.database).toBe('DISCONNECTED');
      expect(result.data.error).toBe('Connection refused');
    });
  });

  // --- Socket Health -------------------------------------------------------

  describe('GET /health/socket', () => {
    it('should return CONNECTED for socket.io service', async () => {
      const result = await controller.getSocketHealth(mockRequest);
      expect(result.success).toBe(true);
      expect(result.data.socket).toBe('CONNECTED');
    });
  });
});
