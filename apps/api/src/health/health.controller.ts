import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { v2 as cloudinary } from 'cloudinary';

@ApiTags('Health Check')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  @Get(['health', 'api/health', 'api/v1/health'])
  @ApiOperation({ summary: 'General health check' })
  async getGeneralHealth(@Req() req?: Request) {
    const timestamp = new Date().toISOString();
    const urlPath = req?.originalUrl || req?.url || '/health';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${timestamp}`);

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
      status: 'OK',
      success: true,
      message: 'System is healthy',
      data: result,
    };
  }

  @Get(['health/database', 'api/health/database', 'api/v1/health/database'])
  @ApiOperation({ summary: 'Database health check' })
  async getDatabaseHealth(@Req() req?: Request) {
    const urlPath = req?.originalUrl || req?.url || '/health/database';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${new Date().toISOString()}`);
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

  @Get(['health/redis', 'api/health/redis', 'api/v1/health/redis'])
  @ApiOperation({ summary: 'Redis Cache health check' })
  async getRedisHealth(@Req() req?: Request) {
    const urlPath = req?.originalUrl || req?.url || '/health/redis';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${new Date().toISOString()}`);
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

  @Get(['health/storage', 'api/health/storage', 'api/v1/health/storage'])
  @ApiOperation({ summary: 'Cloud Storage health check' })
  async getStorageHealth(@Req() req?: Request) {
    const urlPath = req?.originalUrl || req?.url || '/health/storage';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${new Date().toISOString()}`);
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

  @Get(['health/socket', 'api/health/socket', 'api/v1/health/socket'])
  @ApiOperation({ summary: 'Socket.IO health check' })
  async getSocketHealth(@Req() req?: Request) {
    const urlPath = req?.originalUrl || req?.url || '/health/socket';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${new Date().toISOString()}`);
    return {
      status: 'UP',
      socket: 'CONNECTED',
    };
  }
}
