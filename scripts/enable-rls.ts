import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function enableRLS() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL to enable Row Level Security...');
  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const sql = postgres(databaseUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  const tables = [
    'users',
    'interviews',
    'problem_attempts',
    'problems',
    'reports',
    'reviews',
  ];

  try {
    for (const table of tables) {
      console.log(`Enabling RLS on public.${table}...`);
      await sql.unsafe(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`);

      // Drop any old policies if present
      await sql.unsafe(`DROP POLICY IF EXISTS "rls_select_${table}" ON public.${table};`);
      await sql.unsafe(`DROP POLICY IF EXISTS "rls_all_${table}" ON public.${table};`);

      // Allow public read on problems, reviews, and users (needed for leaderboard)
      if (['problems', 'reviews', 'users'].includes(table)) {
        await sql.unsafe(`
          CREATE POLICY "rls_select_${table}" ON public.${table}
            FOR SELECT
            USING (true);
        `);
      }

      // Allow full access for application queries
      await sql.unsafe(`
        CREATE POLICY "rls_all_${table}" ON public.${table}
          FOR ALL
          USING (true)
          WITH CHECK (true);
      `);
      console.log(`✓ RLS and policies applied to public.${table}`);
    }

    console.log('\n🎉 Successfully enabled Row Level Security (RLS) on all 6 tables!');
  } catch (error) {
    console.error('Error applying RLS:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

enableRLS();

