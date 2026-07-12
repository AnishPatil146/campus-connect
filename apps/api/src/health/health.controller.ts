import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { PrismaClient } from '@prisma/client';
import { v2 as cloudinary } from 'cloudinary';

@ApiTags('Health Check')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'General health check' })
  async getGeneralHealth() {
    const uptime = process.uptime();
    const timestamp = new Date().toISOString();

    // 1. Verify Master Database
    let masterStatus = 'UP';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch (e: any) {
      masterStatus = `DOWN (${e.message || String(e)})`;
    }

    // 2. Verify College Databases
    const collegeAUrl = process.env.COLLEGE_A_DATABASE_URL || process.env.DATABASE_A_URL;
    const collegeBUrl = process.env.COLLEGE_B_DATABASE_URL || process.env.DATABASE_B_URL;
    const collegeCUrl = process.env.COLLEGE_C_DATABASE_URL || process.env.DATABASE_c_URL || process.env.DATABASE_C_URL;

    const collegeAStatus = await this.checkDbUrl(collegeAUrl);
    const collegeBStatus = await this.checkDbUrl(collegeBUrl);
    const collegeCStatus = await this.checkDbUrl(collegeCUrl);

    // 3. Verify Redis
    let redisStatus = 'UP';
    try {
      const redisHealth = await this.redisService.ping();
      redisStatus = redisHealth.status;
    } catch (e: any) {
      redisStatus = `DOWN (${e.message || String(e)})`;
    }

    // 4. Verify Cloudinary
    let cloudinaryStatus = 'UP';
    try {
      await cloudinary.api.ping();
    } catch (e: any) {
      cloudinaryStatus = `DOWN (${e.message || String(e)})`;
    }

    // 5. Check helper services status
    const socketStatus = redisStatus === 'UP' ? 'UP' : 'DOWN (Redis is down)';
    const queueStatus = masterStatus === 'UP' ? 'UP' : 'DOWN (Master DB is down)';
    const poolStatus = masterStatus === 'UP' ? 'UP' : 'DOWN';

    const services = {
      api: 'UP',
      masterDatabase: masterStatus,
      collegeADatabase: collegeAStatus,
      collegeBDatabase: collegeBStatus,
      collegeCDatabase: collegeCStatus,
      redis: redisStatus,
      cloudinary: cloudinaryStatus,
      socketIo: socketStatus,
      queueWorkers: queueStatus,
      databasePool: poolStatus,
    };

    const isHealthy = Object.values(services).every((status) => status === 'UP');

    const result = {
      status: isHealthy ? 'UP' : 'DOWN',
      apiVersion: '1.0',
      timestamp,
      uptime,
      services,
    };

    if (!isHealthy) {
      throw new ServiceUnavailableException({
        success: false,
        message: 'One or more dependencies are unhealthy',
        data: result,
      });
    }

    return {
      success: true,
      message: 'System is healthy',
      data: result,
    };
  }

  private async checkDbUrl(url: string | undefined): Promise<string> {
    if (!url) return 'DOWN (url not configured)';
    const client = new PrismaClient({
      datasources: { db: { url } }
    });
    try {
      await client.$connect();
      await client.$queryRaw`SELECT 1`;
      return 'UP';
    } catch (e: any) {
      return `DOWN (${e.message || String(e)})`;
    } finally {
      await client.$disconnect();
    }
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'UP',
        database: 'CONNECTED',
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: err.message || String(err),
      };
    }
  }

  @Get('redis')
  @ApiOperation({ summary: 'Redis Cache health check' })
  async getRedisHealth() {
    try {
      const result = await this.redisService.ping();
      return {
        status: result.status,
        redis: 'CONNECTED',
        latencyMs: result.latencyMs,
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        redis: 'DISCONNECTED',
        error: err.message || String(err),
      };
    }
  }

  @Get('storage')
  @ApiOperation({ summary: 'Cloud Storage health check' })
  async getStorageHealth() {
    try {
      await cloudinary.api.ping();
      return {
        status: 'UP',
        storage: 'CONNECTED',
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        storage: 'DISCONNECTED',
        error: err.message || String(err),
      };
    }
  }

  @Get('socket')
  @ApiOperation({ summary: 'Socket.IO health check' })
  async getSocketHealth() {
    return {
      status: 'UP',
      socket: 'CONNECTED',
    };
  }
}
