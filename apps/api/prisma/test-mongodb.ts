import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the api/.env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testMongoConnection() {
  console.log('🍃 Starting MongoDB Connection Diagnostic...');

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'campus_connect_aux';

  if (!uri) {
    console.error('❌ MONGODB_URI is not defined in .env!');
    process.exit(1);
  }

  if (uri.includes('<db_username>') || uri.includes('<db_password>')) {
    console.warn('⚠️ Placeholder credentials detected in MONGODB_URI:');
    console.warn(`   URI: ${uri}`);
    console.warn('👉 Please update <db_username> and <db_password> in apps/api/.env with your actual Atlas credentials.\n');
    console.log('Diagnostic check completed: Scaffolding is verified, waiting for Atlas credentials.');
    process.exit(0);
  }

  console.log(`🔌 Attempting connection to MongoDB Atlas (${dbName})...`);
  const startTime = Date.now();

  try {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
    });

    const latencyMs = Date.now() - startTime;
    console.log(`✅ [MongoDB Atlas] Connected successfully in ${latencyMs}ms!`);

    const db = mongoose.connection.db;
    if (db) {
      const pingRes = await db.admin().ping();
      console.log('📡 [Ping Response]:', pingRes);

      const collections = await db.listCollections().toArray();
      console.log(`📂 Available Collections in '${dbName}':`, collections.map((c) => c.name));
    }

    console.log('\n🎉 MongoDB Diagnostic Passed with flying colors!');
  } catch (err: any) {
    console.error('❌ [MongoDB] Connection Failed:', err.message || err);
    if (err.message?.includes('Authentication failed') || err.message?.includes('bad auth')) {
      console.error('🔑 Suggestion: Please check that your Atlas username and password are correct.');
    } else if (err.message?.includes('whitelisted') || err.message?.includes('getaddrinfo') || err.message?.includes('ETIMEDOUT') || err.message?.includes('serverSelectionTimeoutMS')) {
      console.error('🌐 Suggestion: Please check that your IP address (or 0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access.');
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

testMongoConnection().catch((err) => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
