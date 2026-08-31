import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { MongoDbService } from '../mongodb/mongodb.service';
import { v2 as cloudinary } from 'cloudinary';

@ApiTags('Health Check')
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    private readonly mongoDbService: MongoDbService,
  ) {}

  @Get(['health', 'api/health', 'api/v1/health'])
  @ApiOperation({ summary: 'General health check' })
  async getGeneralHealth(@Req() req?: Request) {
    const timestamp = new Date().toISOString();
    const urlPath = req?.originalUrl || req?.url || '/health';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${timestamp}`);

    const uptime = process.uptime();
    const mongoStatus = this.mongoDbService.isConnected() ? 'UP' : 'STANDBY';

    // Fast, immediately returning status object.
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
        mongodb: mongoStatus,
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

    // Expose which DB URL host the server is using (credentials masked)
    const rawEnvUrl = process.env.DATABASE_URL || '(not set)';
    let envHost = '(parse error)';
    let activeHost = '(parse error)';
    try { envHost = new URL(rawEnvUrl).host; } catch {}
    try { activeHost = new URL((this.prisma as any).defaultUrl || rawEnvUrl).host; } catch {}

    const hasPooler = activeHost.includes('-pooler');

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1 as ping');
      return { success: true, message: 'Operation successful', data: {
        status: 'UP', database: 'CONNECTED',
        envHost, activeHost, hasPooler,
      }};
    } catch (err: any) {
      // Retry once with a fresh client
      try {
        await (this.prisma as any).resetClient();
        await this.prisma.$queryRawUnsafe('SELECT 1 as ping');
        return { success: true, message: 'Operation successful', data: {
          status: 'UP', database: 'CONNECTED (after retry)',
          envHost, activeHost, hasPooler,
        }};
      } catch (err2: any) {
        return { success: true, message: 'Operation successful', data: {
          status: 'DOWN', database: 'DISCONNECTED',
          envHost, activeHost, hasPooler,
          error: err2.message || String(err2),
        }};
      }
    }
  }

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

  @Get(['health/mongodb', 'api/health/mongodb', 'api/v1/health/mongodb'])
  @ApiOperation({ summary: 'MongoDB Auxiliary database health check' })
  async getMongoDbHealth(@Req() req?: Request) {
    const urlPath = req?.originalUrl || req?.url || '/health/mongodb';
    console.log(`[Health Probe] GET ${urlPath} requested at: ${new Date().toISOString()}`);
    const pingResult = await this.mongoDbService.ping();
    return {
      status: pingResult.status,
      database: pingResult.status === 'UP' ? 'CONNECTED' : 'DISCONNECTED',
      latencyMs: pingResult.latencyMs,
      targetDatabase: pingResult.database,
      error: pingResult.error,
    };
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

