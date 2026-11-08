import postgres from 'postgres';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

async function fixPolicies() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not set.');
    process.exit(1);
  }

  console.log('Connecting to Supabase PostgreSQL to clean up redundant policies...');
  const isPooler = databaseUrl.includes(':6543') || databaseUrl.includes('pooler');
  const sql = postgres(databaseUrl, {
    prepare: !isPooler,
    ssl: 'require',
    max: 1,
  });

  try {
    // 1. Get all current policies on public schema
    const existing = await sql`
      SELECT tablename, policyname
      FROM pg_policies
      WHERE schemaname = 'public';
    `;

    console.log(`Found ${existing.length} existing policies. Dropping them all to start clean...`);
    for (const p of existing) {
      await sql.unsafe(`DROP POLICY IF EXISTS "${p.policyname}" ON public."${p.tablename}";`);
    }

    // 2. Add single, optimal policies per table
    console.log('Creating single, optimal policies without overlap...');

    // problems: public read-only
    await sql.unsafe(`
      CREATE POLICY "allow_read_problems" 
      ON public.problems 
      FOR SELECT 
      TO public 
      USING (true);
    `);
    console.log('✓ public.problems: allow_read_problems');

    // reviews: public read-only
    await sql.unsafe(`
      CREATE POLICY "allow_read_reviews" 
      ON public.reviews 
      FOR SELECT 
      TO public 
      USING (true);
    `);
    console.log('✓ public.reviews: allow_read_reviews');

    // users: public read-only (for leaderboard / profile viewing)
    await sql.unsafe(`
      CREATE POLICY "allow_read_users" 
      ON public.users 
      FOR SELECT 
      TO public 
      USING (true);
    `);
    console.log('✓ public.users: allow_read_users');

    // interviews: authenticated user can read own with InitPlan optimization
    await sql.unsafe(`
      CREATE POLICY "allow_read_interviews" 
      ON public.interviews 
      FOR SELECT 
      TO authenticated 
      USING ((select auth.uid())::text = user_id);
    `);
    console.log('✓ public.interviews: allow_read_interviews');

    // problem_attempts: authenticated user can read own with InitPlan optimization
    await sql.unsafe(`
      CREATE POLICY "allow_read_attempts" 
      ON public.problem_attempts 
      FOR SELECT 
      TO authenticated 
      USING ((select auth.uid())::text = user_id);
    `);
    console.log('✓ public.problem_attempts: allow_read_attempts');

    // reports: authenticated user can read own with InitPlan optimization
    await sql.unsafe(`
      CREATE POLICY "allow_read_reports" 
      ON public.reports 
      FOR SELECT 
      TO authenticated 
      USING ((select auth.uid())::text = user_id);
    `);
    console.log('✓ public.reports: allow_read_reports');

    console.log('\n--- Final Verified Policies in public schema ---');
    const finalPolicies = await sql`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;
    console.table(finalPolicies);

    console.log('\n🎉 Successfully eliminated all redundant permissive policies!');
  } catch (err) {
    console.error('Error fixing policies:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

fixPolicies();

