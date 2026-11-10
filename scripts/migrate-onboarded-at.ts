import postgres from 'postgres';

async function migrate() {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) {
    console.error('DATABASE_URL is missing');
    process.exit(1);
  }
  const cleanUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
  const isPooler = cleanUrl.includes(':6543') || cleanUrl.includes('pooler');
  const sql = postgres(cleanUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  try {
    console.log('Running migration: add onboarded_at column if not exists...');
    await sql.unsafe('ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarded_at TIMESTAMP;');
    console.log('Backfilling onboarded_at for existing users with username...');
    const result = await sql.unsafe(
      'UPDATE users SET onboarded_at = created_at WHERE username IS NOT NULL AND onboarded_at IS NULL;'
    );
    console.log('Migration successful! Updated rows:', result.count);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();

