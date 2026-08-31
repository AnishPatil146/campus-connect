import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { collegeStorage } from '../common/college-storage';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private clients = new Map<string, PrismaClient>();
  private singleClient: PrismaClient | null = null;

  /**
   * CANONICAL Neon PgBouncer pooler URL — this is the ONLY valid production database endpoint.
   * Using the pooler endpoint prevents "Server has closed the connection" when Neon compute
   * scales to zero on idle, because PgBouncer maintains proxy-level connection multiplexing.
   */
  public static readonly MASTER_NEON_URL =
    'postgresql://neondb_owner:npg_Lth9w8nWeZlg@ep-delicate-fog-aebcogwo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=15&connection_limit=10';

  private defaultUrl: string;

  constructor() {
    const rawUrl =
      process.env.DATABASE_URL ||
      process.env.MASTER_DATABASE_URL ||
      process.env.DATABASE_MASTER_URL ||
      PrismaService.MASTER_NEON_URL;

    const activeUrl = PrismaService.sanitizeUrl(rawUrl);

    super({
      datasources: {
        db: {
          url: activeUrl,
        },
      },
    });

    this.defaultUrl = activeUrl;

    // Return a dynamic Proxy so that every model operation has built-in auto-reconnect & retry resilience
    return new Proxy(this, {
      get: (target, prop) => {
        const selfKeys = [
          'onModuleInit',
          'onModuleDestroy',
          'clients',
          'singleClient',
          'defaultUrl',
          'logger',
          'getDatabaseUrl',
          'getClient',
          'getEnvCaseInsensitive',
          'createClientInstance',
          'resetClient',
          'isConnectionClosedError',
          'executeWithRetry',
          'sanitizeUrl',
          'getMaskedUrl',
        ];

        // Direct method access for wrapper-specific members
        if (selfKeys.includes(prop as string)) {
          return (target as any)[prop];
        }

        // Methods on PrismaClient instance itself (e.g. $queryRaw, $executeRaw, $transaction)
        const client = target.getClient();
        const value = (client as any)[prop];

        if (typeof value === 'function') {
          return (...args: any[]) => {
            return target.executeWithRetry(async (activeClient) => {
              const fn = (activeClient as any)[prop];
              if (typeof fn === 'function') {
                return fn.apply(activeClient, args);
              }
              return fn;
            });
          };
        }

        // Model delegates (e.g. prisma.user, prisma.student, prisma.college, etc.)
        if (value && typeof value === 'object') {
          return new Proxy(value, {
            get: (_modelTarget, modelProp) => {
              const propName = prop as string;
              const methodKey = modelProp as string;

              return (...args: any[]) => {
                return target.executeWithRetry(async (activeClient) => {
                  const modelDelegate = (activeClient as any)[propName];
                  if (!modelDelegate) {
                    throw new Error(`Prisma model '${propName}' not found on active client`);
                  }
                  const method = modelDelegate[methodKey];
                  if (typeof method === 'function') {
                    return method.apply(modelDelegate, args);
                  }
                  return method;
                });
              };
            },
          });
        }

        return value;
      },
    });
  }

  /**
   * Sanitizes database connection strings to enforce Neon PgBouncer pooler routing.
   *
   * CRITICAL: Neon serverless compute scales to zero on idle and kills direct TCP connections.
   * The -pooler endpoint (PgBouncer) maintains connection proxies and handles compute spin-up
   * transparently. ALL Neon connections MUST go through the pooler.
   *
   * If DATABASE_URL is the old direct endpoint, this method rewrites it to the pooler endpoint.
   */
  public static sanitizeUrl(rawUrl?: string): string {
    if (!rawUrl || rawUrl.trim() === '') {
      return PrismaService.MASTER_NEON_URL;
    }

    let url = rawUrl.trim();

    // Preserve local PostgreSQL during tests and local Docker
    if (url.includes('localhost') || url.includes('127.0.0.1')) {
      return url;
    }

    // If URL points to old deleted Neon hosts or old Render PostgreSQL databases, route to active Neon
    if (
      url.includes('ep-quiet-bonus') ||
      url.includes('ep-gentle-water') ||
      url.includes('dpg-') ||
      url.includes('oregon-postgres.render.com') ||
      url.includes('frankfurt-postgres.render.com')
    ) {
      return PrismaService.MASTER_NEON_URL;
    }

    // Remove channel_binding=require which causes socket drop in Prisma's Rust TLS engine
    url = url.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1');

    // CRITICAL FIX: Ensure Neon pooled endpoint (-pooler) is used.
    // Direct Neon endpoints (ep-xxx.region.aws.neon.tech) drop idle connections when compute
    // scales to zero. The pooler endpoint (ep-xxx-pooler.region.aws.neon.tech) routes through
    // PgBouncer which handles connection multiplexing and prevents socket drops.
    if (url.includes('neon.tech') && !url.includes('-pooler')) {
      // Rewrite: ep-NAME.REGION.aws.neon.tech → ep-NAME-pooler.REGION.aws.neon.tech
      url = url.replace(/(ep-[a-zA-Z0-9-]+)(\.(?:[a-z0-9-]+\.)+aws\.neon\.tech)/, '$1-pooler$2');
    }

    // Clean up dangling & or ?
    url = url.replace(/[?&]+$/, '');

    // Ensure sslmode=require
    if (!url.includes('sslmode=')) {
      url += (url.includes('?') ? '&' : '?') + 'sslmode=require';
    }

    // Ensure connection timeout
    if (!url.includes('connect_timeout=')) {
      url += '&connect_timeout=30';
    }

    // Ensure pool_timeout to handle compute spin-up latency gracefully
    if (!url.includes('pool_timeout=')) {
      url += '&pool_timeout=15';
    }

    return url;
  }

  /**
   * Automatically retries an operation up to 3 times if a transient connection closure occurs.
   * On each retry, the connection pool is fully reset to ensure no stale sockets are reused.
   */
  public async executeWithRetry<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    const maxRetries = 3;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const client = this.getClient();
        return await operation(client);
      } catch (err: any) {
        lastError = err;
        if (this.isConnectionClosedError(err) && attempt < maxRetries) {
          const delayMs = attempt * 500;
          this.logger.warn(
            `[PrismaService] DB connection closed (attempt ${attempt}/${maxRetries}): ${err.message || err}. Resetting pool in ${delayMs}ms...`
          );
          // Reset client BEFORE next iteration so getClient() returns fresh connection
          await this.resetClient();
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        throw err;
      }
    }

    throw lastError;
  }

  async onModuleInit() {
    if (
      process.env.SINGLE_DB_MODE === 'true' ||
      !process.env.MULTI_DB_ENABLED ||
      process.env.MULTI_DB_ENABLED === 'false'
    ) {
      this.logger.log('🚀 Prisma initialized in Single Cloud Database Mode (Neon PostgreSQL).');
      this.logger.log(`🔗 Database URL host: ${this.getMaskedUrl(this.defaultUrl)}`);
      try {
        const client = this.getClient();
        await client.$connect();
        // Validate connection with a lightweight query
        await client.$queryRaw`SELECT 1 as ping`;
        this.logger.log('✅ Connected to Neon database successfully — connection validated.');
      } catch (err: any) {
        this.logger.error(`❌ Initial database connection error: ${err.message || err}`);
        // Do not throw — allow application to start; retry logic will handle transient errors
      }
      return;
    }

    // Pre-warm connections for all colleges in multi-tenant mode
    const colleges = ['college-a', 'college-b', 'college-c'];
    Promise.all(
      colleges.map(async (collegeId) => {
        try {
          const client = this.createClientInstance(collegeId);
          await client.$connect();
          this.clients.set(collegeId, client);
        } catch (err: any) {
          this.logger.error(`❌ Failed to connect to database for college ${collegeId}: ${err.message || err}`);
        }
      })
    ).then(() => {
      this.logger.log('⚡ Prisma dynamic multi-tenant connection pool pre-warmed.');
    });
  }

  async onModuleDestroy() {
    if (this.singleClient) {
      await this.singleClient.$disconnect().catch(() => {});
    }
    for (const client of this.clients.values()) {
      await client.$disconnect().catch(() => {});
    }
    await this.$disconnect().catch(() => {});
  }

  private getMaskedUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
    } catch {
      return '[unparseable URL]';
    }
  }

  private getDatabaseUrl(collegeId: string): string {
    const cleanId = collegeId.replace('college-', '').toUpperCase().replace(/-/g, '_');
    const fullId = collegeId.toUpperCase().replace(/-/g, '_');

    const keys = [
      `COLLEGE_${cleanId}_DATABASE_URL`,
      `DATABASE_${cleanId}_URL`,
      `COLLEGE_${fullId}_DATABASE_URL`,
      `DATABASE_${fullId}_URL`,
    ];

    for (const key of keys) {
      const url = this.getEnvCaseInsensitive(key);
      if (url) {
        return PrismaService.sanitizeUrl(url);
      }
    }

    return this.defaultUrl;
  }

  private getEnvCaseInsensitive(key: string): string | undefined {
    const upperKey = key.toUpperCase();
    for (const envKey of Object.keys(process.env)) {
      if (envKey.toUpperCase() === upperKey) {
        return process.env[envKey];
      }
    }
    return undefined;
  }

  public isConnectionClosedError(err: any): boolean {
    if (!err || !err.message) return false;
    const msg = String(err.message).toLowerCase();
    return (
      msg.includes('server has closed the connection') ||
      msg.includes('connection closed') ||
      msg.includes('connection terminated') ||
      msg.includes("can't reach database server") ||
      msg.includes('closed the connection') ||
      msg.includes('socket has been ended') ||
      msg.includes('econnreset') ||
      msg.includes('econnrefused') ||
      msg.includes('epipe') ||
      msg.includes('terminating connection') ||
      msg.includes('error in postgresql connection') ||
      msg.includes('prepared statement') ||
      msg.includes('p1001') ||
      msg.includes('p1017')
    );
  }

  public createClientInstance(collegeId?: string): PrismaClient {
    const url = collegeId ? this.getDatabaseUrl(collegeId) : this.defaultUrl;
    return new PrismaClient({
      datasources: {
        db: {
          url: PrismaService.sanitizeUrl(url),
        },
      },
    });
  }

  public async resetClient(): Promise<PrismaClient> {
    if (
      process.env.SINGLE_DB_MODE === 'true' ||
      !process.env.MULTI_DB_ENABLED ||
      process.env.MULTI_DB_ENABLED === 'false'
    ) {
      if (this.singleClient) {
        await this.singleClient.$disconnect().catch(() => {});
        this.singleClient = null;
      }
      const newClient = this.createClientInstance();
      await newClient.$connect().catch(() => {});
      this.singleClient = newClient;
      return this.singleClient;
    }

    const store = collegeStorage.getStore();
    const collegeId = store?.collegeId || 'college-a';
    const oldClient = this.clients.get(collegeId);
    if (oldClient) {
      await oldClient.$disconnect().catch(() => {});
      this.clients.delete(collegeId);
    }
    const newClient = this.createClientInstance(collegeId);
    await newClient.$connect().catch(() => {});
    this.clients.set(collegeId, newClient);
    return newClient;
  }

  public getClient(): PrismaClient {
    if (
      process.env.SINGLE_DB_MODE === 'true' ||
      !process.env.MULTI_DB_ENABLED ||
      process.env.MULTI_DB_ENABLED === 'false'
    ) {
      if (!this.singleClient) {
        this.singleClient = this.createClientInstance();
      }
      return this.singleClient;
    }

    const store = collegeStorage.getStore();
    const collegeId = store?.collegeId || 'college-a';
    let client = this.clients.get(collegeId);
    if (!client) {
      client = this.createClientInstance(collegeId);
      this.clients.set(collegeId, client);
    }
    return client;
  }
}
