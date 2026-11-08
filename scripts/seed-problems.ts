if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {}
}

import {
  generateProblemForRank,
  saveGeneratedProblem,
  RANK_TOPIC_SPECS,
} from '../src/lib/problems/generator';

async function main() {
  const targetRank = process.env.RANK || process.env.TIER;
  const targetCategory = process.env.CATEGORY;

  console.log('='.repeat(65));
  console.log('🎯 Rehearsal AI — Rank-Driven LLM Problem Generator & Seeder');
  console.log('='.repeat(65));

  const rankTiers = targetRank
    ? [targetRank]
    : ['Bronze', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Conqueror'];

  console.log(`Generating problems for rank tiers: ${rankTiers.join(', ')}`);
  if (targetCategory) console.log(`Preferred Category: ${targetCategory}`);

  for (const rank of rankTiers) {
    const spec = RANK_TOPIC_SPECS[rank] || RANK_TOPIC_SPECS.Bronze;
    console.log(`\nGenerating problem for Tier: [${rank}] (${spec.difficulty.toUpperCase()} difficulty)...`);

    try {
      const generated = await generateProblemForRank(rank, targetCategory);
      console.log(`  ✓ Generated: "${generated.title}" (${generated.category})`);
      console.log(`  ✓ Slug: ${generated.slug}`);
      console.log(`  ✓ Test Cases: ${generated.test_cases.filter((t) => !t.is_hidden).length} visible + ${generated.test_cases.filter((t) => t.is_hidden).length} hidden`);
      console.log(`  ✓ Starter Code: Python, JavaScript, C++, Java generated`);
      console.log(`  ✓ Saved to src/data/problems/${generated.slug}.json & Supabase DB`);
    } catch (err: any) {
      console.error(`  ❌ Failed generating problem for ${rank}:`, err?.message || err);
    }
  }

  console.log('\n🎉 Problem seeding process completed successfully!');
}

main().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
