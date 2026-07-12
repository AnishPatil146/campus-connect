import { Module, Global } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore(process.env.REDIS_URL ? {
          url: process.env.REDIS_URL,
          ttl: 5 * 60,
        } : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD || undefined,
          ttl: 5 * 60,
        }),
      }),
    }),
  ],
  providers: [RedisService],
  exports: [CacheModule, RedisService],
})
export class RedisModule {}
