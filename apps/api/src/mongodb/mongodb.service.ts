import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { MongoAuditLog, MongoAuditLogDocument } from './schemas/audit-log.schema';
import { SystemTelemetry, SystemTelemetryDocument } from './schemas/system-telemetry.schema';

@Injectable()
export class MongoDbService implements OnModuleInit {
  private readonly logger = new Logger(MongoDbService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(MongoAuditLog.name)
    private readonly auditLogModel: Model<MongoAuditLogDocument>,
    @InjectModel(SystemTelemetry.name)
    private readonly telemetryModel: Model<SystemTelemetryDocument>,
  ) {}

  onModuleInit() {
    if (!this.connection || typeof this.connection.on !== 'function') return;
    this.connection.on('connected', () => {
      this.logger.log('🍃 MongoDB connected successfully.');
    });

    this.connection.on('error', (err) => {
      this.logger.warn(`🍃 MongoDB connection error: ${err.message}`);
    });

    this.connection.on('disconnected', () => {
      this.logger.warn('🍃 MongoDB disconnected.');
    });
  }

  /**
   * Check if MongoDB is connected and ready.
   */
  isConnected(): boolean {
    return this.connection && this.connection.readyState === 1;
  }

  /**
   * Ping the MongoDB cluster and calculate latency.
   */
  async ping(): Promise<{ status: string; latencyMs: number; database?: string; error?: string }> {
    const start = Date.now();
    try {
      if (!this.isConnected() || !this.connection.db) {
        return {
          status: 'DOWN',
          latencyMs: 0,
          error: `MongoDB not connected (readyState: ${this.connection?.readyState ?? 0})`,
        };
      }

      await this.connection.db.admin().ping();
      const latencyMs = Date.now() - start;
      return {
        status: 'UP',
        latencyMs,
        database: this.connection.name,
      };
    } catch (err: any) {
      return {
        status: 'DOWN',
        latencyMs: Date.now() - start,
        error: err.message || String(err),
      };
    }
  }

  /**
   * Log an activity record to MongoDB auxiliary collection.
   */
  async logAudit(logData: {
    userId?: string | null;
    userName: string;
    role: string;
    action: string;
    details?: string;
    module?: string;
    entityType?: string;
    entityId?: string;
    ipAddress?: string;
    metadata?: Record<string, any>;
  }): Promise<MongoAuditLogDocument | null> {
    try {
      if (!this.isConnected()) return null;
      return await this.auditLogModel.create({
        ...logData,
        timestamp: new Date(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write audit log to MongoDB: ${err.message}`);
      return null;
    }
  }

  /**
   * Fetch audit logs from MongoDB with pagination.
   */
  async getAuditLogs(filter: Record<string, any> = {}, limit = 50, skip = 0) {
    if (!this.isConnected()) return { data: [], total: 0 };
    try {
      const [data, total] = await Promise.all([
        this.auditLogModel.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
        this.auditLogModel.countDocuments(filter).exec(),
      ]);
      return { data, total };
    } catch (err: any) {
      this.logger.warn(`Failed to query MongoDB audit logs: ${err.message}`);
      return { data: [], total: 0 };
    }
  }

  /**
   * Record system telemetry snapshot.
   */
  async recordTelemetry(data: {
    node: string;
    status: string;
    memoryUsageMb: number;
    cpuPercent: number;
    activeSessions?: number;
    diagnostics?: Record<string, any>;
  }): Promise<SystemTelemetryDocument | null> {
    try {
      if (!this.isConnected()) return null;
      return await this.telemetryModel.create({
        ...data,
        recordedAt: new Date(),
      });
    } catch (err: any) {
      this.logger.warn(`Failed to write telemetry to MongoDB: ${err.message}`);
      return null;
    }
  }
}
