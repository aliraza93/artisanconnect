import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file if it exists (for local development)
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
  // .env file not found, using environment variables
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createSessionTable() {
  const client = await pool.connect();
  try {
    console.log('📋 Creating session table...\n');

    // Create session table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default",
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL,
        CONSTRAINT session_pkey PRIMARY KEY (sid)
      )
    `);
    console.log('✅ Session table created');

    // Create index on expire column for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire)
    `);
    console.log('✅ Session index created');

    console.log('\n✅ Session table setup completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Failed to create session table:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createSessionTable();

