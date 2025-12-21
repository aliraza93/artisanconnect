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
} catch {}

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL must be set');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkColumns() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'jobs' 
      AND column_name IN ('address', 'latitude', 'longitude')
      ORDER BY column_name
    `);
    
    console.log('\nColumns in jobs table:');
    if (result.rows.length === 0) {
      console.log('❌ No address/latitude/longitude columns found');
    } else {
      result.rows.forEach((row: any) => {
        console.log(`✅ ${row.column_name}: ${row.data_type}`);
      });
    }
    
    if (result.rows.length < 3) {
      console.log('\nAdding missing columns...');
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS address TEXT');
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)');
      await client.query('ALTER TABLE jobs ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)');
      console.log('✅ All columns added!');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

checkColumns()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

