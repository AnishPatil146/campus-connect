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
    // and administrative operations are dynamically routed to the active client with auto-reconnect resilience.
    return new Proxy(this, {
      get: (target, prop) => {
        const selfKeys = [
          'onModuleInit', 
          'onModuleDestroy', 
          'clients', 
          'defaultUrl', 
          'getDatabaseUrl', 
          'getClient',
          'getEnvCaseInsensitive',
          'createClientInstance',
          'resetClient'
        ];
        
        // If the property is a wrapper-specific method or field, return it directly.
        if (selfKeys.includes(prop as string)) {
          return (target as any)[prop];
        }

        // Delegate everything else to the request-specific PrismaClient instance.
        const client = target.getClient();
        const value = (client as any)[prop];
        if (typeof value === 'function') {
          return async (...args: any[]) => {
            try {
              return await value.apply(client, args);
            } catch (err: any) {
              if (target.isConnectionClosedError(err)) {
                console.warn(`[PrismaService] Connection closed during operation '${String(prop)}', reconnecting and retrying...`);
                const refreshedClient = target.resetClient();
                const refreshedFn = (refreshedClient as any)[prop];
                if (typeof refreshedFn === 'function') {
                  return await refreshedFn.apply(refreshedClient, args);
                }
              }
              throw err;
            }
          };
        }

        // If the property is a model delegate (e.g. prisma.user, prisma.student), wrap its methods
        if (value && typeof value === 'object') {
          return new Proxy(value, {
            get: (modelTarget, modelProp) => {
              const originalMethod = modelTarget[modelProp];
              if (typeof originalMethod === 'function') {
                return async (...args: any[]) => {
                  try {
                    return await originalMethod.apply(modelTarget, args);
                  } catch (err: any) {
                    if (target.isConnectionClosedError(err)) {
                      console.warn(`[PrismaService] Connection closed during model query '${String(prop)}.${String(modelProp)}', reconnecting and retrying...`);
                      const refreshedClient = target.resetClient();
                      const refreshedModel = (refreshedClient as any)[prop];
                      if (refreshedModel && typeof refreshedModel[modelProp] === 'function') {
                        return await refreshedModel[modelProp].apply(refreshedModel, args);
                      }
                    }
                    throw err;
                  }
                };
              }
              return originalMethod;
            }
          });
        }

        return value;
      },
    });
  }

  async onModuleInit() {
    if (process.env.SINGLE_DB_MODE === 'true' || !process.env.MULTI_DB_ENABLED || process.env.MULTI_DB_ENABLED === 'false') {
      console.log('🚀 Prisma running in Single Database Mode (connecting in background).');
      this.$connect()
        .then(() => {
          console.log('✅ Connected to database successfully.');
        })
        .catch((err: any) => {
          console.error(`❌ Failed to connect to database: ${err.message || err}`);
        });
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

  public isConnectionClosedError(err: any): boolean {
    if (!err || !err.message) return false;
    const msg = err.message.toLowerCase();
    return (
      msg.includes('server has closed the connection') ||
      msg.includes('connection closed') ||
      msg.includes('connection terminated') ||
      msg.includes('can\'t reach database server') ||
      msg.includes('closed the connection') ||
      msg.includes('socket has been ended') ||
      msg.includes('econnreset') ||
      msg.includes('epipe')
    );
  }

  public createClientInstance(collegeId: string): PrismaClient {
    const url = this.getDatabaseUrl(collegeId);
    return new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  public resetClient(): PrismaClient {
    if (process.env.SINGLE_DB_MODE === 'true' || !process.env.MULTI_DB_ENABLED || process.env.MULTI_DB_ENABLED === 'false') {
      this.$disconnect().catch(() => {});
      this.$connect().catch(() => {});
      return this;
    }
    const store = collegeStorage.getStore();
    const collegeId = store?.collegeId || 'college-a';
    const oldClient = this.clients.get(collegeId);
    if (oldClient) {
      oldClient.$disconnect().catch(() => {});
      this.clients.delete(collegeId);
    }
    const newClient = this.createClientInstance(collegeId);
    this.clients.set(collegeId, newClient);
    return newClient;
  }

  public getClient(): PrismaClient {
    if (process.env.SINGLE_DB_MODE === 'true' || !process.env.MULTI_DB_ENABLED || process.env.MULTI_DB_ENABLED === 'false') {
      return this;
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
