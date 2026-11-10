if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (error) {
    console.warn('Could not load .env; using environment variables already present.', error);
  }
}

import { buildExecutableCode } from '../src/lib/judge/harness';
import { runLocalSandbox } from '../src/lib/judge/localRunner';
import type { GeneratedProblemBankRecord } from '../src/lib/problems/generator';
import { buildStarterCode, templateForTopic } from './curated-problem-bank';
import type { CuratedTemplate } from './curated-problem-bank';

function normalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, normalize(item)])
    );
  }
  return value;
}

async function verifyTemplate(template: CuratedTemplate) {
  const code = buildExecutableCode(template.python, 'python', template.functionName);
  const outputs: string[] = [];

  for (let index = 0; index < template.tests.length; index++) {
    const test = template.tests[index];
    const result = await runLocalSandbox({
      code,
      language: 'python',
      stdin: test.input.map((arg) => JSON.stringify(arg)).join(', '),
      timeoutMs: 4000,
    });

    if (result.exitCode !== 0 || result.timedOut) {
      throw new Error(`${template.title}, test ${index + 1} failed: ${result.stderr}`);
    }

    const output = result.stdout.trim();
    let actual: unknown = output;
    try {
      actual = JSON.parse(output);
    } catch {
      // The Python judge harness prints string results without JSON quoting.
    }

    if (JSON.stringify(normalize(actual)) !== JSON.stringify(normalize(test.expected))) {
      throw new Error(
        `${template.title}, test ${index + 1} mismatch: expected ${JSON.stringify(test.expected)}, received ${output}`
      );
    }
    outputs.push(output);
  }

  return outputs;
}

async function main() {
  const targetCount = Number(process.env.PROBLEM_BANK_SIZE || 50);
  if (!Number.isInteger(targetCount) || targetCount < 50 || targetCount > 100) {
    throw new Error('PROBLEM_BANK_SIZE must be an integer between 50 and 100.');
  }

  const [{ RANK_DIFFICULTY_MAP }, database] = await Promise.all([
    import('../src/config/rankDifficulty'),
    import('../src/db'),
  ]);
  if (!database.isDatabaseConfigured() || !database.db) {
    throw new Error('A valid DATABASE_URL is required to seed the problem bank.');
  }

  const templates = new Map<string, CuratedTemplate>();
  const verifiedOutputs = new Map<string, string[]>();
  const problems: Array<{
    rankTier: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topic: string;
    title: string;
    payload: GeneratedProblemBankRecord;
  }> = [];
  const ranks = Object.values(RANK_DIFFICULTY_MAP);
  let generated = 0;

  while (generated < targetCount) {
    const profile = ranks.find((rank) => {
      const current = problems.filter((problem) => problem.rankTier === rank.rankTier).length;
      const rankIndex = ranks.indexOf(rank);
      const desired = Math.ceil(targetCount / ranks.length) - (rankIndex >= targetCount % ranks.length ? 1 : 0);
      return current < desired;
    });
    if (!profile) break;

    const rankIndex = ranks.indexOf(profile);
    const rankCount = problems.filter((problem) => problem.rankTier === profile.rankTier).length;
    const topic = profile.allowedTopics[rankCount % profile.allowedTopics.length];
    const template = templateForTopic(topic, rankCount + rankIndex);
    templates.set(template.key, template);
    const outputs =
      verifiedOutputs.get(template.key) || (await verifyTemplate(template));
    verifiedOutputs.set(template.key, outputs);

    const starterCode = buildStarterCode(template);
    const sequence = rankCount + 1;
    const id = `pb_${profile.rankTier.toLowerCase()}_${sequence}_${template.key}`;
    const title = `${template.title} - ${profile.rankTier} ${topic} ${sequence}`;
    const testCases = template.tests.map((test, index) => ({
      input: test.input.map((value) => JSON.stringify(value)).join(', '),
      expected_output: outputs[index],
      is_hidden: index >= 3,
    }));
    const payload: GeneratedProblemBankRecord = {
      id,
      source: 'Rehearsal AI',
      externalId: id,
      title,
      url: '',
      difficulty: profile.difficulty,
      topics: [topic],
      rankTier: profile.rankTier,
      company_tags: ['General'],
      description: template.description,
      constraints: template.constraints,
      examples: template.tests.slice(0, 2).map((test) => ({
        input: JSON.stringify(test.input),
        output: JSON.stringify(test.expected),
      })),
      functionSpec: {
        name: template.functionName,
        params: template.params,
        returnType: template.returnType,
      },
      unorderedOutput: false,
      starterCode,
      starter_code: starterCode,
      test_cases: testCases,
      referenceSolutionPython: template.python,
    };

    problems.push({
      rankTier: profile.rankTier,
      difficulty: profile.difficulty,
      topic,
      title,
      payload,
    });
    generated++;
  }

  console.log(`Verified ${verifiedOutputs.size} solution templates against all five tests.`);
  console.log(`Prepared ${problems.length} problem records across all six rank tiers.`);

  let saved = 0;
  for (const problem of problems) {
    const result = await database.db
      .insert(database.schema.problemBank)
      .values({
        id: problem.payload.id as string,
        rankTier: problem.rankTier,
        difficulty: problem.difficulty,
        topic: problem.topic,
        title: problem.title,
        payload: problem.payload,
      })
      .onConflictDoNothing()
      .returning({ id: database.schema.problemBank.id });

    if (result.length) {
      saved++;
      console.log(`Saved ${problem.rankTier} / ${problem.topic}: ${problem.title}`);
    } else {
      console.warn(`Skipped existing bank entry: ${problem.title}`);
    }
  }

  console.log(`Problem bank complete: ${saved} saved; ${problems.length - saved} already existed.`);
}

main().catch((error) => {
  console.error('Curated problem bank seeding failed:', error);
  process.exitCode = 1;
});
