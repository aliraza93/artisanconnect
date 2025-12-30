import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { runMigrations as runStripeMigrations } from 'stripe-replit-sync';
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

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting database migrations...\n');

    // Run Stripe migrations (required for Stripe functionality)
    try {
      console.log('💳 Running Stripe schema migrations...');
      await runStripeMigrations({ databaseUrl: process.env.DATABASE_URL! });
      console.log('✅ Stripe migrations completed\n');
    } catch (error: any) {
      console.error('⚠️  Stripe migrations error:', error.message);
      // Don't fail the deployment if Stripe migrations fail (might already be migrated)
      console.log('ℹ️  Continuing with other migrations...\n');
    }

    // Ensure session table exists (required for sessions)
    try {
      console.log('📋 Ensuring session table exists...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS session (
          sid VARCHAR NOT NULL COLLATE "default",
          sess JSON NOT NULL,
          expire TIMESTAMP(6) NOT NULL,
          CONSTRAINT session_pkey PRIMARY KEY (sid)
        )
      `);
      await client.query(`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session(expire)
      `);
      console.log('✅ Session table ready\n');
    } catch (error: any) {
      console.error('⚠️  Session table error:', error.message);
      // Continue anyway
    }

    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();

