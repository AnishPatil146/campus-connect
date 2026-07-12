import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { collegeStorage } from '../common/college-storage';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private clients = new Map<string, PrismaClient>();
  private defaultUrl = process.env.DATABASE_URL || process.env.MASTER_DATABASE_URL || process.env.DATABASE_MASTER_URL || 'postgresql://postgres:postgrespassword@localhost:5444/campus-connect?schema=public';

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || process.env.MASTER_DATABASE_URL || process.env.DATABASE_MASTER_URL || 'postgresql://postgres:postgrespassword@localhost:5444/campus-connect?schema=public',
        },
      },
    });
    // Return a Proxy of the PrismaService instance so that accesses to models 
    // and administrative operations are dynamically routed to the active client.
    return new Proxy(this, {
      get: (target, prop) => {
        const selfKeys = [
          'onModuleInit', 
          'onModuleDestroy', 
          'clients', 
          'defaultUrl', 
          'getDatabaseUrl', 
          'getClient',
          'getEnvCaseInsensitive'
        ];
        
        // If the property is a wrapper-specific method or field, return it directly.
        if (selfKeys.includes(prop as string)) {
          return (target as any)[prop];
        }

        // Delegate everything else to the request-specific PrismaClient instance.
        const client = target.getClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
          return value.bind(client);
        }
        return value;
      },
    });
  }

  async onModuleInit() {
    if (process.env.SINGLE_DB_MODE === 'true' || !process.env.MULTI_DB_ENABLED) {
      console.log('🚀 Prisma running in Single Database Mode.');
      try {
        await this.$connect();
        console.log('✅ Connected to database successfully.');
      } catch (err: any) {
        console.error(`❌ Failed to connect to database: ${err.message || err}`);
        throw err;
      }
      return;
    }

    // Pre-warm the connections for all colleges in the background
    const colleges = ['college-a', 'college-b', 'college-c'];
    Promise.all(
      colleges.map(async (collegeId) => {
        try {
          const url = this.getDatabaseUrl(collegeId);
          const client = new PrismaClient({
            datasources: {
              db: {
                url,
              },
            },
          });
          await client.$connect();
          this.clients.set(collegeId, client);
        } catch (err: any) {
          console.error(`❌ Failed to connect to database for college ${collegeId}: ${err.message || err}`);
        }
      })
    ).then(() => {
      console.log('⚡ Prisma dynamic multi-tenant connection pool pre-warmed.');
    });
  }

  async onModuleDestroy() {
    for (const client of this.clients.values()) {
      await client.$disconnect();
    }
    await this.$disconnect();
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
        return url;
      }
    }

    // Dynamic fallback
    const parsed = new URL(this.defaultUrl);
    const dbName = `campus_connect_${collegeId.replace(/-/g, '_')}`;
    parsed.pathname = `/${dbName}`;
    return parsed.toString();
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

  public getClient(): PrismaClient {
    if (process.env.SINGLE_DB_MODE === 'true' || !process.env.MULTI_DB_ENABLED) {
      return this;
    }
    const store = collegeStorage.getStore();
    const collegeId = store?.collegeId || 'college-a';
    let client = this.clients.get(collegeId);
    if (!client) {
      const url = this.getDatabaseUrl(collegeId);
      client = new PrismaClient({
        datasources: {
          db: {
            url,
          },
        },
      });
      this.clients.set(collegeId, client);
    }
    return client;
  }
}
