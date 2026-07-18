// run from apps/api directory: node test/auth/reset-locks.js
const path = require('path');
const fs = require('fs');

// Load .env from apps/api
const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) envVars[m[1].trim()] = m[2].trim();
}

const { PrismaClient } = require('@prisma/client');

const TEST_EMAILS = [
  'student@collegea.edu', 'teacher@collegea.edu', 'admin@collegea.edu',
  'student@collegeb.edu', 'teacher@collegeb.edu', 'admin@collegeb.edu',
  'student@collegec.edu', 'teacher@collegec.edu', 'admin@collegec.edu',
];

const DBS = [
  { label: 'college-a', url: envVars['COLLEGE_A_DATABASE_URL'] },
  { label: 'college-b', url: envVars['COLLEGE_B_DATABASE_URL'] },
  { label: 'college-c', url: envVars['COLLEGE_C_DATABASE_URL'] },
].filter(d => d.url);

async function run() {
  if (DBS.length === 0) {
    console.error('No database URLs found. Check apps/api/.env for COLLEGE_A_DATABASE_URL etc.');
    process.exit(1);
  }

  for (const db of DBS) {
    const prisma = new PrismaClient({ datasources: { db: { url: db.url } } });
    try {
      const locked = await prisma.user.findMany({
        where: {
          email: { in: TEST_EMAILS },
          OR: [{ lockedUntil: { not: null } }, { failedLoginAttempts: { gt: 0 } }]
        },
        select: { email: true, lockedUntil: true, failedLoginAttempts: true }
      });

      if (locked.length > 0) {
        console.log(`\n[${db.label}] Found ${locked.length} locked/failed accounts:`);
        locked.forEach(u => console.log(`  ${u.email} | lockedUntil: ${u.lockedUntil} | attempts: ${u.failedLoginAttempts}`));
      } else {
        console.log(`[${db.label}] No locked accounts found.`);
      }

      const result = await prisma.user.updateMany({
        where: { email: { in: TEST_EMAILS } },
        data: { lockedUntil: null, failedLoginAttempts: 0 }
      });
      console.log(`[${db.label}] Reset ${result.count} accounts.`);
    } catch (e) {
      console.error(`[${db.label}] Error:`, e.message);
    } finally {
      await prisma.$disconnect();
    }
  }
  console.log('\nDone. All test accounts unlocked.');
}

run().catch(e => { console.error(e); process.exit(1); });
