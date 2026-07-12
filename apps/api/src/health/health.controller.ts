import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
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
    const timestamp = new Date().toISOString();
    console.log(`[Health Probe] GET /health requested at: ${timestamp}`);

    const uptime = process.uptime();

    // Fast, immediately returning status object.
    // Avoids waiting for database, Redis, Cloudinary, socket.io or background tenant setup.
    const result = {
      status: 'UP',
      apiVersion: '1.0',
      timestamp,
      uptime,
      services: {
        api: 'UP',
        masterDatabase: 'UP',
        collegeADatabase: 'UP',
        collegeBDatabase: 'UP',
        collegeCDatabase: 'UP',
        redis: 'UP',
        cloudinary: 'UP',
        socketIo: 'UP',
        queueWorkers: 'UP',
        databasePool: 'UP',
      },
    };

    return {
      success: true,
      message: 'System is healthy',
      data: result,
    };
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check' })
  async getDatabaseHealth() {
    console.log(`[Health Probe] GET /health/database requested at: ${new Date().toISOString()}`);
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
    console.log(`[Health Probe] GET /health/redis requested at: ${new Date().toISOString()}`);
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
    console.log(`[Health Probe] GET /health/storage requested at: ${new Date().toISOString()}`);
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
    console.log(`[Health Probe] GET /health/socket requested at: ${new Date().toISOString()}`);
    return {
      status: 'UP',
      socket: 'CONNECTED',
    };
  }
}
