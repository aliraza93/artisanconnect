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

async function addColumns() {
  const client = await pool.connect();
  try {
    console.log('Adding address, latitude, and longitude columns to jobs table...');
    
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS address TEXT
    `);
    console.log('✅ Added address column');
    
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8)
    `);
    console.log('✅ Added latitude column');
    
    await client.query(`
      ALTER TABLE jobs 
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8)
    `);
    console.log('✅ Added longitude column');
    
    console.log('✅ All columns added successfully!');
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

addColumns()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

