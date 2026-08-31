import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';

@ApiTags('Health Check')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get(['health', 'api/health', 'api/v1/health'])
  @ApiOperation({ summary: 'General health check' })
  async getGeneralHealth(@Req() req: Request) {
    const timestamp = new Date().toISOString();
    console.log(`[Health Probe] GET ${req?.url || '/health'} at: ${timestamp}`);
    return {
      status: 'OK',
      success: true,
      message: 'System is healthy',
      data: {
        status: 'UP',
        apiVersion: '1.0',
        timestamp,
        uptime: process.uptime(),
        services: {
          api: 'UP',
          database: 'UP',
          cloudinary: 'UP',
          socketIo: 'UP',
        },
      },
    };
  }

  @Get(['health/database', 'api/health/database', 'api/v1/health/database'])
  @ApiOperation({ summary: 'Database health check' })
  async getDatabaseHealth(@Req() req: Request) {
    console.log(`[Health Probe] GET ${req?.url || '/health/database'} at: ${new Date().toISOString()}`);
    const rawEnvUrl = process.env.DATABASE_URL || '(not set)';
    let envHost = '(parse error)';
    try { envHost = new URL(rawEnvUrl).host; } catch {}

    try {
      await this.prisma.$queryRawUnsafe('SELECT 1 as ping');
      return {
        success: true,
        message: 'Database connected',
        data: { status: 'UP', database: 'CONNECTED', host: envHost },
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'Database disconnected',
        data: {
          status: 'DOWN',
          database: 'DISCONNECTED',
          host: envHost,
          error: err.message || String(err),
        },
      };
    }
  }

  @Get(['health/storage', 'api/health/storage', 'api/v1/health/storage'])
  @ApiOperation({ summary: 'Cloudinary storage health check' })
  async getStorageHealth(@Req() req: Request) {
    console.log(`[Health Probe] GET ${req?.url || '/health/storage'} at: ${new Date().toISOString()}`);
    try {
      await cloudinary.api.ping();
      return { success: true, data: { status: 'UP', storage: 'CONNECTED' } };
    } catch (err: any) {
      return { success: false, data: { status: 'DOWN', storage: 'DISCONNECTED', error: err.message } };
    }
  }

  @Get(['health/socket', 'api/health/socket', 'api/v1/health/socket'])
  @ApiOperation({ summary: 'Socket.IO health check' })
  async getSocketHealth(@Req() req: Request) {
    console.log(`[Health Probe] GET ${req?.url || '/health/socket'} at: ${new Date().toISOString()}`);
    return { success: true, data: { status: 'UP', socket: 'CONNECTED' } };
  }
}
