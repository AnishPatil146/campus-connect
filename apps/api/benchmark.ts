import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import IoRedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../apps/api/.env') });

async function run() {
  console.log('Starting benchmark...');
  
  // 1. Benchmark Bcrypt
  const password = 'password123';
  const startHash = Date.now();
  const hash = bcrypt.hashSync(password, 12);
  console.log(`Bcrypt Hash Sync (12 rounds) took: ${Date.now() - startHash}ms`);
  
  const startCompare = Date.now();
  const match = await bcrypt.compare(password, hash);
  console.log(`Bcrypt Compare took: ${Date.now() - startCompare}ms (match: ${match})`);

  // 2. Benchmark DB connection
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  });
  
  const firstUser = await prisma.user.findFirst();
  const userId = firstUser?.id || '';
  console.log(`Found user: ${userId}`);

  const startDb = Date.now();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
  console.log(`Prisma query (nested includes) took: ${Date.now() - startDb}ms (user found: ${!!user})`);

  const startDbRaw = Date.now();
  const rawResults = await prisma.$queryRawUnsafe<any[]>(`
    SELECT 
      u.id, u.email, u.full_name as "name", u.status, u.deleted_at as "deletedAt", u.college_id as "collegeId",
      r.name as "roleName",
      p.name as "permissionName"
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    LEFT JOIN roles r ON r.id = ur.role_id
    LEFT JOIN role_permissions rp ON rp.role_id = r.id
    LEFT JOIN permissions p ON p.id = rp.permission_id
    WHERE u.id = $1
  `, userId);
  console.log(`Prisma $queryRaw (flat query) took: ${Date.now() - startDbRaw}ms (rows: ${rawResults?.length})`);
  
  // 3. Benchmark Redis connection
  if (process.env.REDIS_URL) {
    const redis = new IoRedis(process.env.REDIS_URL);
    const startPing = Date.now();
    await redis.ping();
    console.log(`Redis Ping (cold) took: ${Date.now() - startPing}ms`);

    const startSet = Date.now();
    await redis.set('test_key', 'val');
    console.log(`Redis Set (warm) took: ${Date.now() - startSet}ms`);

    const startGet = Date.now();
    const val = await redis.get('test_key');
    console.log(`Redis Get (warm) took: ${Date.now() - startGet}ms (value: ${val})`);

    const startDel = Date.now();
    await redis.del('test_key');
    console.log(`Redis Del (warm) took: ${Date.now() - startDel}ms`);
    await redis.quit();
  }
  
  await prisma.$disconnect();
}

run().catch(console.error);
