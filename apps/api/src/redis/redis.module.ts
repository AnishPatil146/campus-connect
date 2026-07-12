import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisInsStore } from 'cache-manager-ioredis-yet';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => {
        const isProduction = process.env.NODE_ENV === 'production';
        let client: Redis;
        const commonOptions = {
          maxRetriesPerRequest: null,
          connectTimeout: 10000,
          keepAlive: 10000,
          retryStrategy(times: number) {
            // Exponential backoff up to 3 seconds to avoid spamming the Redis server
            return Math.min(times * 100, 3000);
          },
        };

        if (isProduction || process.env.REDIS_URL) {
          if (!process.env.REDIS_URL) {
            throw new Error('[Redis] REDIS_URL environment variable is required in production.');
          }
          console.log(`[Redis] Connecting using REDIS_URL connection string...`);
          client = new Redis(process.env.REDIS_URL, commonOptions);
        } else {
          // Local development configuration fallback
          const host = process.env.REDIS_HOST || 'localhost';
          const port = parseInt(process.env.REDIS_PORT || '6379', 10);
          const password = process.env.REDIS_PASSWORD || undefined;
          
          console.log(`[Redis] Using local development configuration:`);
          console.log(`  - Host: ${host}`);
          console.log(`  - Port: ${port}`);
          console.log(`  - Password: ${password ? '********' : 'none'}`);
          
          client = new Redis({
            host,
            port,
            password,
            ...commonOptions,
          });
        }

        client.on('error', (err: any) => {
          console.error('[Redis] Client error occurred:', err);
        });

        try {
          console.log('[Redis] Sending PING to Redis server...');
          const pong = await client.ping();
          if (pong === 'PONG') {
            console.log('[Redis] Redis Connected');
          } else {
            console.warn(`[Redis] Unexpected response to PING: ${pong}`);
          }
        } catch (pingError: any) {
          console.error('[Redis] Failed to connect / PING Redis server:', pingError.message);
        }

        const store = redisInsStore(client, {
          ttl: 5 * 60 * 1000, // cache-manager-ioredis-yet v2 expects TTL in milliseconds
        });

        return { store };
      },
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}

