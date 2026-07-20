import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { RedisService } from './src/redis/redis.service';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const redis = app.get(RedisService);

  const keys = [
    'user:auth:teacher@collegea.edu',
    'user:profile:54c7e714-c265-41cc-813f-75f71807ecfc:TEACHER'
  ];

  for (const key of keys) {
    const val = await redis.get(key);
    console.log(`Key: ${key} -> Found: ${!!val}`);
  }

  await app.close();
}

run().catch(console.error);
