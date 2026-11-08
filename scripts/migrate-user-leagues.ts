import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function migrateLeagues() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const sql = postgres(databaseUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  try {
    console.log('--- Migrating Users Table for Technical & HR Separate Leagues ---');

    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS technical_rank VARCHAR(32) DEFAULT 'Bronze' NOT NULL;
    `;
    console.log('✓ Added technical_rank');

    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS technical_points INTEGER DEFAULT 0 NOT NULL;
    `;
    console.log('✓ Added technical_points');

    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS hr_rank VARCHAR(32) DEFAULT 'Bronze' NOT NULL;
    `;
    console.log('✓ Added hr_rank');

    await sql`
      ALTER TABLE public.users 
      ADD COLUMN IF NOT EXISTS hr_points INTEGER DEFAULT 0 NOT NULL;
    `;
    console.log('✓ Added hr_points');

    // Populate initial values from existing rank/points if they are 0
    await sql`
      UPDATE public.users 
      SET technical_points = points, technical_rank = rank
      WHERE technical_points = 0 AND points > 0;
    `;
    console.log('✓ Synced existing points to technical_points');

    // Create indexes for fast leaderboard sorting
    await sql`
      CREATE INDEX IF NOT EXISTS users_tech_leaderboard_idx 
      ON public.users (technical_points DESC);
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS users_hr_leaderboard_idx 
      ON public.users (hr_points DESC);
    `;
    console.log('✓ Created indexes for Technical and HR leaderboards');

    const cols = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users';
    `;
    console.log('\n--- Verified users table columns ---');
    console.table(cols);
    console.log('🎉 Successfully migrated database for dual Technical & HR leagues!');
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrateLeagues();

