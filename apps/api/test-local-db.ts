import { PrismaClient } from '@prisma/client';

async function testUrl(url: string) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    await prisma.$connect();
    console.log(`Success! Connected with url: ${url}`);
    await prisma.$disconnect();
    return true;
  } catch (err: any) {
    console.log(`Failed with url: ${url} - Error: ${err.message}`);
    return false;
  }
}

async function run() {
  const urls = [
    'postgresql://postgres:postgrespassword@localhost:5432/postgres',
    'postgresql://postgres:postgres@localhost:5432/postgres',
    'postgresql://postgres@localhost:5432/postgres',
    'postgresql://postgres:postgrespassword@127.0.0.1:5432/postgres',
  ];
  for (const url of urls) {
    if (await testUrl(url)) break;
  }
}

run();
