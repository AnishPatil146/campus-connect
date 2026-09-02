import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    const sanitizedUrl = PrismaService.sanitizeUrl(rawUrl);

    super({
      datasources: {
        db: { url: sanitizedUrl },
      },
    });

    // Attach resilient query middleware to automatically retry transient connection drops
    this.$use(async (params, next) => {
      const maxRetries = 3;
      let lastError: any = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await next(params);
        } catch (err: any) {
          lastError = err;
          if (PrismaService.isConnectionClosedError(err) && attempt < maxRetries) {
            const delayMs = attempt * 300;
            this.logger.warn(
              `[PrismaService] Transient connection error on ${params.model}.${params.action} (attempt ${attempt}/${maxRetries}): ${err.message || err}. Retrying in ${delayMs}ms...`
            );
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          throw err;
        }
      }
      throw lastError;
    });
  }

  /**
   * Sanitizes database connection strings by ensuring Neon pooled connection (PgBouncer)
   * is used to prevent "Server has closed the connection" when Neon serverless compute
   * scales to zero on idle.
   */
  public static sanitizeUrl(rawUrl?: string): string {
    if (!rawUrl || rawUrl.trim() === '') {
      return rawUrl || '';
    }
    let url = rawUrl.trim();

    // Strip wrapping quotes
    url = url.replace(/^["']|["']$/g, '');

    // CRITICAL FIX: The ONLY canonical database is Neon PostgreSQL.
    // If an environment variable contains an obsolete or dead database host (e.g. old Render PostgreSQL dpg-xxx),
    // override with the canonical Neon connection string.
    if (url.includes('render.com') || url.includes('dpg-') || !url.includes('neon.tech')) {
      return 'postgresql://neondb_owner:npg_Lth9w8nWeZlg@ep-delicate-fog-aebcogwo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30&pool_timeout=20&connection_limit=10&pgbouncer=true';
    }

    // Remove channel_binding=require which causes socket drops in Prisma's Rust TLS engine
    url = url.replace(/([?&])channel_binding=[^&]*(&|$)/g, '$1');

    // CRITICAL FIX: Ensure Neon pooled endpoint (-pooler) is used.
    // Direct Neon endpoints (ep-xxx.region.aws.neon.tech) drop idle connections when compute
    // scales to zero. The pooler endpoint routes through PgBouncer which handles connection
    // multiplexing and prevents socket drops.
    if (url.includes('neon.tech') && !url.includes('-pooler')) {
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
      url += '&pool_timeout=20';
    }

    // Ensure connection_limit
    if (!url.includes('connection_limit=')) {
      url += '&connection_limit=10';
    }

    // Ensure pgbouncer=true
    if (!url.includes('pgbouncer=')) {
      url += '&pgbouncer=true';
    }

    return url;
  }

  public static isConnectionClosedError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || err).toLowerCase();
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

  async onModuleInit() {
    try {
      await this.$connect();
      await this.$queryRawUnsafe('SELECT 1 as ping');
      this.logger.log('✅ Connected to Neon PostgreSQL (PgBouncer pooler) — connection validated.');
    } catch (err: any) {
      this.logger.error(`❌ Initial database connection warning: ${err.message || err}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect().catch(() => {});
  }
}
