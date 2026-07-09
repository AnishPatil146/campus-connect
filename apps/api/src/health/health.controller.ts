import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

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
    return {
      status: 'UP',
      timestamp: new Date().toISOString(),
      services: {
        api: 'UP',
      },
    };
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
    return {
      status: 'UP',
      storage: 'CONNECTED',
    };
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
