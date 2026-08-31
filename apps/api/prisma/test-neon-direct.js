const path = require('path');
const { PrismaClient } = require(path.join(__dirname, '../../../../campus-connect/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client'));

const POOLER = 'postgresql://neondb_owner:npg_Lth9w8nWeZlg@ep-delicate-fog-aebcogwo-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';
const DIRECT = 'postgresql://neondb_owner:npg_Lth9w8nWeZlg@ep-delicate-fog-aebcogwo.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&connect_timeout=30';

async function run() {
  console.log('=== TEST 1: POOLER endpoint ===');
  const p1 = new PrismaClient({ datasources: { db: { url: POOLER } } });
  try {
    const r = await p1.$queryRawUnsafe('SELECT 1 as ping');
    console.log('POOLER -> SUCCESS:', JSON.stringify(r));
  } catch(e) {
    console.error('POOLER -> FAIL:', e.message);
  } finally {
    await p1.$disconnect().catch(() => {});
  }

  console.log('');
  console.log('=== TEST 2: DIRECT (no pooler) endpoint ===');
  const p2 = new PrismaClient({ datasources: { db: { url: DIRECT } } });
  try {
    const r = await p2.$queryRawUnsafe('SELECT 1 as ping');
    console.log('DIRECT -> SUCCESS:', JSON.stringify(r));
  } catch(e) {
    console.error('DIRECT -> FAIL:', e.message);
  } finally {
    await p2.$disconnect().catch(() => {});
  }

  console.log('');
  console.log('=== TEST 3: user.findUnique via POOLER ===');
  const p3 = new PrismaClient({ datasources: { db: { url: POOLER } } });
  try {
    const u = await p3.user.findUnique({ where: { email: 'student@college.edu' } });
    console.log('findUnique -> SUCCESS:', u ? u.email : 'USER NOT FOUND IN DB');
  } catch(e) {
    console.error('findUnique -> FAIL:', e.message);
  } finally {
    await p3.$disconnect().catch(() => {});
  }
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
