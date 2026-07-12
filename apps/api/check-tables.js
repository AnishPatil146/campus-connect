const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '.env') });

const databases = [
  { name: 'Master DB (DATABASE_URL)', envKey: 'DATABASE_URL' },
  { name: 'College A DB (COLLEGE_A_DATABASE_URL)', envKey: 'COLLEGE_A_DATABASE_URL' },
  { name: 'College B DB (COLLEGE_B_DATABASE_URL)', envKey: 'COLLEGE_B_DATABASE_URL' },
  { name: 'College C DB (COLLEGE_C_DATABASE_URL)', envKey: 'COLLEGE_C_DATABASE_URL' },
];

async function inspectDatabase(name, url) {
  if (!url) {
    console.log(`\n⚠️  [${name}] Not configured (environment variable missing).\n`);
    return;
  }

  console.log(`\n========================================`);
  console.log(`📡 Inspecting [${name}]`);
  console.log(`🔌 Connection URL: ${url.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  console.log(`========================================`);

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url,
      },
    },
  });

  try {
    await prisma.$connect();
    
    // Fetch all user tables in public schema
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    if (!tables || tables.length === 0) {
      console.log('ℹ️  No tables found in this database.');
      return;
    }

    console.log(`📊 Found ${tables.length} tables. Fetching row counts...`);

    const tableReport = [];
    for (const row of tables) {
      const tableName = row.table_name;
      try {
        // Query row count for each table
        const countResult = await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::integer as count FROM "${tableName}"`
        );
        const count = countResult[0]?.count ?? 0;
        tableReport.push({ 'Table Name': tableName, 'Row Count': count });
      } catch (err) {
        tableReport.push({ 'Table Name': tableName, 'Row Count': 'ERROR: ' + err.message });
      }
    }

    console.table(tableReport);
  } catch (error) {
    console.error(`❌ Failed to inspect database:`, error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  console.log('🚀 Starting Database Table Inspection Script...');
  for (const db of databases) {
    const url = process.env[db.envKey];
    await inspectDatabase(db.name, url);
  }
  console.log('\n✅ Database inspection finished.');
}

run().catch((err) => {
  console.error('Fatal inspection script error:', err);
});
