import { PrismaClient } from '@prisma/client';

async function run() {
  const masterUrl = 'postgresql://neondb_owner:npg_CqAk4MXOsy5v@ep-quiet-bonus-au6m8rwv-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require';
  const prisma = new PrismaClient({ datasources: { db: { url: masterUrl } } });
  
  try {
    await prisma.$connect();
    console.log('Connected to neondb. Renaming databases to clean names without spaces...');
    
    try {
      await prisma.$executeRawUnsafe(`ALTER DATABASE "campus connect db part A" RENAME TO campus_connect_db_a;`);
      console.log('✅ Renamed DB A -> campus_connect_db_a');
    } catch (e: any) {
      console.log('DB A rename status:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER DATABASE "campus connect db part B" RENAME TO campus_connect_db_b;`);
      console.log('✅ Renamed DB B -> campus_connect_db_b');
    } catch (e: any) {
      console.log('DB B rename status:', e.message);
    }

    try {
      await prisma.$executeRawUnsafe(`ALTER DATABASE "campus connect db part C" RENAME TO campus_connect_db_c;`);
      console.log('✅ Renamed DB C -> campus_connect_db_c');
    } catch (e: any) {
      console.log('DB C rename status:', e.message);
    }

    const dbs: any = await prisma.$queryRaw`SELECT datname FROM pg_database WHERE datistemplate = false;`;
    console.log('Updated databases on Neon project:', dbs.map((d: any) => d.datname));

  } catch (err: any) {
    console.error('Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }

  // Now test connecting to the renamed databases!
  for (const letter of ['a', 'b', 'c']) {
    const colUrl = `postgresql://neondb_owner:npg_CqAk4MXOsy5v@ep-quiet-bonus-au6m8rwv-pooler.c-10.us-east-1.aws.neon.tech/campus_connect_db_${letter}?sslmode=require`;
    const colPrisma = new PrismaClient({ datasources: { db: { url: colUrl } } });
    try {
      await colPrisma.$connect();
      console.log(`🎉 [College ${letter.toUpperCase()}] SUCCESS! Connected to campus_connect_db_${letter}`);
    } catch (e: any) {
      console.error(`❌ [College ${letter.toUpperCase()}] Failed:`, e.message);
    } finally {
      await colPrisma.$disconnect();
    }
  }
}

run();





