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

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Starting database reset...\n');

    // Disable foreign key checks temporarily by dropping constraints
    console.log('1. Dropping all tables (in order to handle foreign keys)...');
    
    // Get all table names
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    const tableNames = tablesResult.rows.map((row: any) => row.tablename);
    console.log(`   Found ${tableNames.length} tables: ${tableNames.join(', ')}`);

    // Drop all tables (CASCADE will handle foreign keys)
    for (const tableName of tableNames) {
      try {
        await client.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`   ✅ Dropped table: ${tableName}`);
      } catch (error: any) {
        console.log(`   ⚠️  Error dropping ${tableName}: ${error.message}`);
      }
    }

    // Drop all enums
    console.log('\n2. Dropping all enums...');
    const enumsResult = await client.query(`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    const enumNames = enumsResult.rows.map((row: any) => row.typname);
    for (const enumName of enumNames) {
      try {
        await client.query(`DROP TYPE IF EXISTS "${enumName}" CASCADE`);
        console.log(`   ✅ Dropped enum: ${enumName}`);
      } catch (error: any) {
        console.log(`   ⚠️  Error dropping ${enumName}: ${error.message}`);
      }
    }

    console.log('\n3. All tables dropped. Ready for schema recreation.');

    console.log('4. Creating session table...');
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
      console.log(`   ⚠️  Error creating session table: ${error.message}`);
    }

    console.log('\n5. Creating index on session.expire...');
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS IDX_session_expire ON session (expire)
      `);
      console.log('   ✅ Index created');
    } catch (error: any) {
      console.log(`   ⚠️  Error creating index: ${error.message}`);
    }

    console.log('\n✅ Database reset completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Run: npm run db:push');
    console.log('   2. This will create all tables from the schema');
    console.log('   3. Then run: npm run dev');
    
  } catch (error: any) {
    console.error('\n❌ Database reset failed:', error.message);
    console.error(error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

