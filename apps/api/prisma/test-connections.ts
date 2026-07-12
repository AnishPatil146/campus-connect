import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the api/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbs = [
  { name: 'MASTER_DATABASE_URL / DATABASE_URL', envKey: 'DATABASE_URL' },
  { name: 'MASTER_DATABASE_URL', envKey: 'MASTER_DATABASE_URL' },
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

  if (hasErrors) {
    console.error('💥 Database connections verification failed with errors!');
    process.exit(1);
  } else {
    console.log('🎉 All Database Connections Verified Successfully!');
    process.exit(0);
  }
}

checkConnections().catch((err) => {
  console.error('Fatal connection check error:', err);
  process.exit(1);
});
