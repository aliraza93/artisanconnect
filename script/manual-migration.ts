import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

// Load .env file
try {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const envPath = join(__dirname, '..', '.env');
  const envFile = readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach((line: string) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim().replace(/^["']|["']$/g, '');
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.log('No .env file found, using environment variables');
}

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL must be set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runManualMigration() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting manual database migration...\n');

    // 1. Add address columns to jobs table
    console.log('1. Adding address columns to jobs table...');
    try {
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address TEXT');
      console.log('   ✅ Added address column');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  address column already exists');
      } else {
        throw error;
      }
    }

    try {
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)');
      console.log('   ✅ Added latitude column');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  latitude column already exists');
      } else {
        throw error;
      }
    }

    try {
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)');
      console.log('   ✅ Added longitude column');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  longitude column already exists');
      } else {
        throw error;
      }
    }

    // 2. Create session table
    console.log('\n2. Creating session table...');
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL,
          CONSTRAINT session_pkey PRIMARY KEY (sid)
        )
      `);
      console.log('   ✅ Session table created');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  session table already exists');
      } else {
        throw error;
      }
    }

    // 3. Create index on expire column
    console.log('\n3. Creating index on session.expire...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
      `);
      console.log('   ✅ Index created');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  index already exists');
      } else {
        throw error;
      }
    }

    // 4. Verify changes
    console.log('\n4. Verifying changes...');
    const jobsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name IN ('address', 'latitude', 'longitude')
      ORDER BY column_name
    `);
    
    if (jobsColumns.rows.length === 3) {
      console.log('   ✅ All jobs columns present:');
      jobsColumns.rows.forEach((row: any) => {
        console.log(`      - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log(`   ⚠️  Expected 3 columns, found ${jobsColumns.rows.length}`);
    }

    const sessionTable = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'session'
    `);
    
    if (sessionTable.rows.length > 0) {
      console.log('   ✅ Session table exists');
    } else {
      console.log('   ❌ Session table not found');
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runManualMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

