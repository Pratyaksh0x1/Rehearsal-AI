import postgres from 'postgres';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (
    !databaseUrl ||
    databaseUrl.includes('[PASSWORD]') ||
    databaseUrl.includes('[HOST]')
  ) {
    console.error(
      '❌ Valid Supabase DATABASE_URL is not set. Please update DATABASE_URL in your .env file.'
    );
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL...');
  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const sql = postgres(databaseUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  try {
    const migrationsDir = join(process.cwd(), 'drizzle');
    const sqlFiles = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of sqlFiles) {
      console.log(`Executing migration ${file}...`);
      const filePath = join(migrationsDir, file);
      const sqlContent = readFileSync(filePath, 'utf-8');

      // Split statements safely
      const statements = sqlContent
        .split('--> statement-breakpoint')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const stmt of statements) {
        await sql.unsafe(stmt);
      }
    }

    console.log('✅ Migrations completed successfully on Supabase PostgreSQL.');
  } finally {
    await sql.end();
  }
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
