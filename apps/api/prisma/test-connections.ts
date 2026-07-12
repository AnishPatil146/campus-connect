import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the api/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbs = [
  { name: 'DATABASE_URL', envKey: 'DATABASE_URL' },
  { name: 'COLLEGE_A_DATABASE_URL', envKey: 'COLLEGE_A_DATABASE_URL' },
  { name: 'COLLEGE_B_DATABASE_URL', envKey: 'COLLEGE_B_DATABASE_URL' },
  { name: 'COLLEGE_C_DATABASE_URL', envKey: 'COLLEGE_C_DATABASE_URL' },
];

async function checkConnections() {
  console.log('📡 Starting Database Connections Verification...');
  let hasErrors = false;

  for (const db of dbs) {
    const url = process.env[db.envKey];
    if (!url) {
      console.error(`❌ [${db.name}] Environment variable ${db.envKey} is not set!`);
      hasErrors = true;
      continue;
    }

    console.log(`🔌 Connecting to [${db.name}]...`);
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url,
        },
      },
    });

    try {
      await prisma.$connect();
      const res = await prisma.$queryRaw`SELECT 1 as connected`;
      console.log(`✅ [${db.name}] Connected successfully! Query output:`, res);
    } catch (e: any) {
      console.error(`❌ [${db.name}] Failed to connect:`, e.message || e);
      hasErrors = true;
    } finally {
      await prisma.$disconnect();
    }
  }

  // Verify Redis Connection
  console.log('\n📡 Starting Redis Connection Verification...');
  const redisUrl = process.env.REDIS_URL;
  let redisClient: Redis;
  if (redisUrl) {
    console.log('🔌 Connecting to Redis using REDIS_URL...');
    redisClient = new Redis(redisUrl, { maxRetriesPerRequest: null, connectTimeout: 10000 });
  } else {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const password = process.env.REDIS_PASSWORD || undefined;
    console.log(`🔌 Connecting to local Redis at ${host}:${port}...`);
    redisClient = new Redis({ host, port, password, maxRetriesPerRequest: null, connectTimeout: 10000 });
  }
  try {
    const pong = await redisClient.ping();
    if (pong === 'PONG') {
      console.log('✅ [Redis] Connected successfully!');
    } else {
      console.error(`❌ [Redis] Unexpected PING response: ${pong}`);
      hasErrors = true;
    }
  } catch (e: any) {
    console.error(`❌ [Redis] Failed to connect:`, e.message || e);
    hasErrors = true;
  } finally {
    await redisClient.quit();
  }

  // Verify Cloudinary Connection
  console.log('\n📡 Starting Cloudinary Connection Verification...');
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudinaryUrl = process.env.CLOUDINARY_URL;

  if (cloudinaryUrl) {
    cloudinary.config({ cloudinary_url: cloudinaryUrl });
  } else if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  } else {
    console.error('❌ [Cloudinary] Credentials not configured!');
    hasErrors = true;
  }

  if (cloudinaryUrl || (cloudName && apiKey && apiSecret)) {
    try {
      console.log('🔌 Connecting to Cloudinary ping endpoint...');
      await cloudinary.api.ping();
      console.log('✅ [Cloudinary] Connected successfully!');
    } catch (e: any) {
      console.error(`❌ [Cloudinary] Failed to connect:`, e.message || e);
      hasErrors = true;
    }
  }

  console.log('\n-----------------------------------------');
  if (hasErrors) {
    console.error('💥 Connection verification failed with errors!');
    process.exit(1);
  } else {
    console.log('🎉 All Connections Verified Successfully!');
    process.exit(0);
  }
}

checkConnections().catch((err) => {
  console.error('Fatal connection check error:', err);
  process.exit(1);
});
