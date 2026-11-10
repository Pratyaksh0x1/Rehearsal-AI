import { generateWithSchema } from '@/lib/llm';
import { GeneratedProblemSchema, GeneratedProblem } from '@/lib/llm/schemas';
import { getRankDifficultyProfile, RankDifficultyConfig } from '@/config/rankDifficulty';
import { buildExecutableCode } from '@/lib/judge/harness';
import { runLocalSandbox } from '@/lib/judge/localRunner';
import { saveProblemSession } from './session';
import { TestCase } from '@/lib/judge';

export interface GenerateProblemParams {
  rankTier: string;
  company?: string | null;
  language?: string;
  topic?: string;
  previousProblemTitles?: string[];
}

export interface GeneratedProblemResponse {
  problemSessionId: string;
  problem: {
    id: string;
    source: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    topics: string[];
    rankTier: string;
    company_tags: string[];
    description: string;
    constraints: string[];
    examples: Array<{ input: string; output: string; explanation?: string }>;
    functionSpec: {
      name: string;
      params: Array<{ name: string; type: string }>;
      returnType: string;
    };
    unorderedOutput?: boolean;
    starterCode: {
      python: string;
      javascript: string;
      typescript: string;
      cpp: string;
      java: string;
    };
    test_cases: TestCase[]; // 3 visible test cases ONLY
  };
}

export type GeneratedProblemBankRecord = Omit<
  GeneratedProblemResponse['problem'],
  'test_cases'
> & {
  externalId: string;
  url: string;
  starter_code: GeneratedProblem['starterCode'];
  test_cases: Array<{ input: string; expected_output: string; is_hidden: boolean }>;
  referenceSolutionPython: string;
};

interface GeneratedInterviewProblemWithRecord {
  response: GeneratedProblemResponse;
  bankRecord: GeneratedProblemBankRecord;
}

/**
 * Company interview style guidelines mapping
 */
function getCompanyStylePrompt(company?: string | null): string {
  if (!company || company.toLowerCase() === 'any company') {
    return 'General industry-standard tech interview style: clean, modern algorithmic problem with a clear objective and real-world relevance.';
  }

  const c = company.toLowerCase();
  if (c.includes('amazon')) {
    return 'Amazon Interview Style: Practical, e-commerce, warehouse distribution, logistics, customer order fulfillment, or package delivery scenario. Problem should feel like a real engineering challenge faced by Amazon software teams.';
  }
  if (c.includes('google')) {
    return 'Google Interview Style: Pattern-heavy, mathematically rigorous, elegant problem testing clean abstractions, graph invariants, dynamic programming, or bitwise logic. Values optimal asymptotic complexity and clean code.';
  }
  if (c.includes('microsoft')) {
    return 'Microsoft Interview Style: Classic computer science algorithmic problem testing tree/graph traversals, string manipulation, or array processing. Values clarity, boundary conditions, and robust enterprise edge cases.';
  }
  if (c.includes('meta') || c.includes('facebook')) {
    return 'Meta Interview Style: High-efficiency algorithmic challenge focusing on two-pointer, sliding window, binary search, or graph/tree traversals with tight time complexity constraints.';
  }
  if (c.includes('apple')) {
    return 'Apple Interview Style: Hardware-adjacent, memory-efficient, buffer processing, device synchronization, or audio/video packet processing algorithmic challenge.';
  }
  if (c.includes('netflix') || c.includes('uber') || c.includes('stripe')) {
    return `${company} Interview Style: High-throughput stream processing, rate limiting, geospatial grid dispatch, transaction ledger routing, or interval overlapping challenge.`;
  }

  return `${company} Style: Practical engineering-centric DSA problem testing core algorithmic fundamentals and data structure choice.`;
}

/**
 * Validates referenceSolutionPython in local sandbox against all 5 test cases.
 * Returns verified outputs or null if verification fails.
 */
async function verifyReferenceSolution(
  referenceSolutionPython: string,
  testCases: Array<{ input: unknown[]; expected?: unknown }>,
  functionName: string,
  unorderedOutput: boolean
): Promise<{ verifiedOutputs: string[]; success: boolean; error?: string }> {
  const executableCode = buildExecutableCode(referenceSolutionPython, 'python', functionName);
  const results = await Promise.all(
    testCases.map(async (tc, i) => {
      // Serialize input arguments into comma-separated JSON representations
      const stdin = tc.input.map((arg) => JSON.stringify(arg)).join(', ');

      try {
        const res = await runLocalSandbox({
          code: executableCode,
          language: 'python',
          stdin,
          timeoutMs: 4000,
        });

        if (res.exitCode !== 0 || res.timedOut) {
          return {
            output: null,
            error: `Test case ${i + 1} execution failed: ${res.stderr || 'Timed out (4s)'}`,
          };
        }

        const out = res.stdout.trim();
        if (!out) {
          return {
            output: null,
            error: `Test case ${i + 1} produced no output (the reference method must return a value)`,
          };
        }

        let actual: unknown = out;
        try {
          actual = JSON.parse(out);
        } catch {
          // String results are printed without JSON quotes by the Python harness.
        }

        const normalize = (value: unknown, allowUnordered = false): unknown => {
          if (Array.isArray(value)) {
            const items = value.map((item) => normalize(item));
            return unorderedOutput && allowUnordered
              ? items.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
              : items;
          }
          if (value && typeof value === 'object') {
            return Object.fromEntries(
              Object.entries(value as Record<string, unknown>)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, item]) => [key, normalize(item)])
            );
          }
          return value;
        };

        if (
          JSON.stringify(normalize(actual, true)) !==
          JSON.stringify(normalize(tc.expected, true))
        ) {
          return {
            output: null,
            error: `Test case ${i + 1} output mismatch: expected ${JSON.stringify(tc.expected)}, received ${out}`,
          };
        }

        return { output: out };
      } catch (err: any) {
        return {
          output: null,
          error: `Sandbox execution error on test case ${i + 1}: ${err?.message || err}`,
        };
      }
    })
  );

  const failed = results.find((result) => result.error);
  if (failed?.error) {
    return { verifiedOutputs: [], success: false, error: failed.error };
  }
  return {
    verifiedOutputs: results.map((result) => result.output!),
    success: true,
  };
}

/**
 * Generates an original DSA coding problem on-the-fly via LLM tailored to rank and company.
 * Never stores problems to disk or database. Verifies all test case outputs in sandbox.
 */
export async function generateInterviewProblem({
  rankTier,
  company,
  language = 'python',
  topic,
  previousProblemTitles = [],
}: GenerateProblemParams): Promise<GeneratedProblemResponse> {
  const { response } = await generateInterviewProblemWithRecord({
    rankTier,
    company,
    language,
    topic,
    previousProblemTitles,
  });
  return response;
}

export async function generateInterviewProblemForBank(
  params: GenerateProblemParams
): Promise<GeneratedInterviewProblemWithRecord> {
  return generateInterviewProblemWithRecord(params);
}

async function generateInterviewProblemWithRecord({
  rankTier,
  company,
  language = 'python',
  topic,
  previousProblemTitles = [],
}: GenerateProblemParams): Promise<GeneratedInterviewProblemWithRecord> {
  const rankProfile: RankDifficultyConfig = getRankDifficultyProfile(rankTier);
  const companyStyle = getCompanyStylePrompt(company);

  // Randomize primary topic from allowed topics
  const allowed = rankProfile.allowedTopics;
  if (topic && !allowed.includes(topic)) {
    throw new Error(`Topic "${topic}" is not configured for rank ${rankProfile.rankTier}.`);
  }
  const primaryTopic = topic || allowed[Math.floor(Math.random() * allowed.length)];
  const isCodeforcesStory = Math.random() < 0.35;
  const randomSeed = Math.floor(Math.random() * 100000);

  const previousTitlesStr =
    previousProblemTitles.length > 0
      ? `\nPREVIOUSLY ATTEMPTED TITLES (DO NOT REPEAT ANY OF THESE):\n${previousProblemTitles.map((t) => `- "${t}"`).join('\n')}`
      : '';

  const systemPrompt = `You are a Principal Algorithms Interviewer generating a pure Data Structures & Algorithms (DSA) problem for a live technical coding interview.

CANDIDATE RANK & DIFFICULTY (STRICT RULE):
- Candidate Rank: ${rankProfile.rankTier} (${rankProfile.difficultyDetailed})
- Difficulty Tier: ${rankProfile.difficulty}
- Target Time Complexity: ${rankProfile.targetComplexity.time}
- Target Space Complexity: ${rankProfile.targetComplexity.space}
- Primary Focus Topic: ${primaryTopic}
- Allowed Topics for this Rank: ${allowed.join(', ')}
- Complexity & Constraint Guidelines: ${rankProfile.guidelines}
- Number of Constraints: ${rankProfile.constraintsCount}

COMPANY FLAVOR:
- Targeted Company: ${company || 'Any company'}
- Flavor Guidelines: ${companyStyle}

PROBLEM REQUIREMENTS (PURE DSA ONLY):
1. Must be a pure algorithmic coding problem solvable with standard data structures.
   NO system design, NO web APIs, NO SQL, NO concurrency, NO external libraries.
2. The problem MUST be original and inspired by real interviews.
   DO NOT copy verbatim from LeetCode. NEVER mention LeetCode problem numbers, URLs, or external contest names.
3. ${isCodeforcesStory ? 'CODEFORCES STORY: Wrap the problem statement in a creative, brief real-world or sci-fi/fantasy story while maintaining 100% rigorous mathematical DSA specifications.' : 'REALISTIC WORKPLACE STORY: Frame the problem as an engineering challenge that would arise at ' + (company || 'a top tech company') + '.'}
4. RANDOM SEED FOR UNIQUENESS: #${randomSeed}. Ensure this problem is fresh and distinct from standard templates.
5. Do not repeat or lightly rephrase any prior problem. Choose a different underlying algorithmic task and title.${previousTitlesStr}

STARTER CODE REQUIREMENTS (LEETCODE STYLE):
Generate complete starter code for all 5 languages (python, javascript, typescript, cpp, java):
- Match functionSpec.name and functionSpec.params EXACTLY.
- Python:
  class Solution:
      def ${'{functionSpec.name}'}(self, ${'{params}'}) -> ${'{returnType}'}:
          pass
- C++:
  #include <vector>
  #include <string>
  using namespace std;

  class Solution {
  public:
      ${'{returnType}'} ${'{functionSpec.name}'}(${'{params}'}) {
          
      }
  };
- Java:
  class Solution {
      public ${'{returnType}'} ${'{functionSpec.name}'}(${'{params}'}) {
          
      }
  }
- JavaScript & TypeScript: Function or class Solution with matching parameter signatures.
- If the problem involves linked lists or binary trees, include the standard ListNode or TreeNode definition helper class.
- NO solution logic or hints in the starter code.

TEST CASES REQUIREMENTS (EXACTLY 5 CASES):
- Cases 1, 2, 3: "hidden": false (visible cases for run-code in sandbox: simple, typical, and one edge case).
- Cases 4, 5: "hidden": true (hidden edge/larger cases for submit verification: boundary cases, negatives, empty/single, or stress cases).
- Keep every test input small (roughly 12 elements / 30 characters at most) so the whole JSON stays compact and the expected outputs are easy to verify.
- "input": Must be an array of JSON values in the exact parameter order of functionSpec.params.
  Example: if function is twoSum(nums, target), input must be [[2, 7, 11, 15], 9].
- "expected": Expected output value.
- "referenceSolutionPython": Complete, correct, optimal Python 3 solution implementing "class Solution" and the method. Must pass all 5 test cases.`;

  const userPrompt = `Generate a single complete DSA interview problem for Rank: ${rankProfile.rankTier} (${rankProfile.difficulty}), Company: ${company || 'Any company'}.
Primary topic: ${primaryTopic}. Return strictly valid JSON adhering to the schema.`;

  const MAX_GENERATION_ATTEMPTS = 4;
  let lastError = '';
  const excludedTitles = new Set(previousProblemTitles.map((title) => title.trim().toLowerCase()));
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: attempt === 1
            ? userPrompt
            : `${userPrompt}\n\nThe previous generated problem could not be used: ${lastError}. Generate a different problem with a new title. Keep the JSON compact, and ensure the reference solution runs and returns a value for all 5 test cases.`,
        },
      ];

      // A full problem (statement + 5 languages of starter code + 5 tests + reference solution)
      // is far larger than the 2048-token default, which truncated the JSON and made the first
      // attempt fail. Give it a big budget and a longer timeout; the outer loop does the retrying.
      const res = await generateWithSchema(messages, GeneratedProblemSchema, {
        allowMockFallback: false,
        maxTokens: 8192,
        timeoutMs: 60000,
        temperature: 0.7,
        maxSchemaAttempts: 1,
      });
      const generated = res.data;
      const difficulty = (['Easy', 'Medium', 'Hard'] as const).find(
        (value) => value === generated.difficulty
      );
      if (!difficulty) {
        throw new Error(`Unsupported generated difficulty: ${generated.difficulty}`);
      }

      // Normalise to exactly 5 tests: first 3 visible, last 2 hidden.
      generated.testCases = generated.testCases
        .slice(0, 5)
        .map((tc, idx) => ({ ...tc, hidden: idx >= 3 }));

      if (excludedTitles.has(generated.title.trim().toLowerCase())) {
        lastError = `The generated title "${generated.title}" has already been used for this candidate.`;
        excludedTitles.add(generated.title.trim().toLowerCase());
        continue;
      }

      // Sandbox Verification: Execute referenceSolutionPython against all 5 test cases
      const verification = await verifyReferenceSolution(
        generated.referenceSolutionPython,
        generated.testCases,
        generated.functionSpec.name,
        generated.unorderedOutput ?? false
      );

      if (!verification.success) {
        console.warn(
          `[ProblemGenerator] Attempt ${attempt} failed sandbox verification:`,
          verification.error
        );
        lastError = verification.error || 'Reference solution failed execution';
        continue;
      }

      // Convert verified test cases into judge runner format
      const runnerTestCases: TestCase[] = generated.testCases.map((tc, idx) => {
        const stdin = tc.input.map((arg) => JSON.stringify(arg)).join(', ');
        const verifiedOutput = verification.verifiedOutputs[idx];
        return {
          input: stdin,
          expected_output: verifiedOutput || JSON.stringify(tc.expected),
          is_hidden: tc.hidden,
        };
      });

      // Prepare full problem object for in-memory session
      const problemSlug = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fullProblemRecord: any = {
        id: problemSlug,
        source: 'Rehearsal AI',
        externalId: problemSlug,
        title: generated.title,
        url: '',
        difficulty,
        topics: generated.topics,
        rankTier: rankProfile.rankTier,
        company_tags: company ? [company] : ['General'],
        description: generated.description,
        constraints: generated.constraints,
        examples: generated.examples,
        functionSpec: generated.functionSpec,
        unorderedOutput: generated.unorderedOutput ?? false,
        starter_code: generated.starterCode,
        starterCode: generated.starterCode,
        test_cases: runnerTestCases, // 3 visible + 2 hidden (stored in server session)
        referenceSolutionPython: generated.referenceSolutionPython,
      };

      // Save in server session cache (never disk or database)
      const problemSessionId = saveProblemSession(fullProblemRecord);

      // Return sanitized problem to client: visible test cases ONLY
      const clientVisibleCases = runnerTestCases.filter((t) => !t.is_hidden);

      const bankRecord: GeneratedProblemBankRecord = {
        ...fullProblemRecord,
      };

      return {
        bankRecord,
        response: {
          problemSessionId,
          problem: {
          id: problemSlug,
          source: 'Rehearsal AI',
          title: generated.title,
          difficulty,
          topics: generated.topics,
          rankTier: rankProfile.rankTier,
          company_tags: company ? [company] : ['General'],
          description: generated.description,
          constraints: generated.constraints,
          examples: generated.examples,
          functionSpec: generated.functionSpec,
          unorderedOutput: generated.unorderedOutput,
          starterCode: generated.starterCode,
          test_cases: clientVisibleCases, // Only the 3 visible test cases!
        },
        },
      };
    } catch (err: any) {
      console.warn(`[ProblemGenerator] Generation attempt ${attempt} error:`, err?.message || err);
      lastError = err?.message || String(err);
    }
  }

  throw new Error(`Failed to generate a verified, non-repeating problem for ${rankTier}: ${lastError}`);
}

export const RANK_TOPIC_SPECS: Record<
  string,
  { difficulty: 'easy' | 'medium' | 'hard'; topics: string[]; description: string }
> = {
  Bronze: {
    difficulty: 'easy',
    topics: ['arrays', 'strings', 'hashing'],
    description: 'Foundational algorithmic problems testing iteration, frequency maps, and string parsing.',
  },
  Gold: {
    difficulty: 'medium',
    topics: ['two-pointers', 'sliding-window', 'stacks-queues', 'binary-search'],
    description: 'Intermediate problem patterns testing linear scans with multiple pointers.',
  },
  Platinum: {
    difficulty: 'medium',
    topics: ['binary-trees', 'linked-lists', 'backtracking', 'recursion', 'graphs-bfs'],
    description: 'Subproblem decomposition with recursion, pointer manipulation, and BFS.',
  },
  Diamond: {
    difficulty: 'hard',
    topics: ['dynamic-programming', 'graph-dfs-bfs', 'topological-sort', 'union-find'],
    description: 'Advanced state transitions, shortest paths, and topological sort.',
  },
  Crown: {
    difficulty: 'hard',
    topics: ['2d-dynamic-programming', 'tries', 'dijkstra', 'segment-trees'],
    description: 'FAANG Hard & Codeforces 1500+ complexity requiring multi-dimensional DP.',
  },
  Conqueror: {
    difficulty: 'hard',
    topics: ['monotonic-queue', 'bitmask-dp', 'network-flow', 'range-queries'],
    description: 'Elite competitive programming problems testing monotonic queues and state compression.',
  },
};

export async function generateProblemForRank(rankTier: string, category?: string) {
  const result = await generateInterviewProblem({ rankTier, company: category });
  return {
    ...result.problem,
    slug: result.problem.id,
    category: result.problem.topics[0] || 'algorithms',
    starter_code: result.problem.starterCode,
    rank_tier: result.problem.rankTier,
  };
}

export async function saveGeneratedProblem(problem: any) {
  return problem;
}

export function getFallbackProblemForRank(rankTier: string, category?: string): any {
  const normalized = (rankTier || 'Bronze').toLowerCase();
  const isHard = ['diamond', 'crown', 'conqueror'].includes(normalized);
  const isMedium = ['gold', 'platinum'].includes(normalized);

  if (isHard) {
    return {
      title: 'Course Schedule II',
      slug: `course-schedule-ii-${normalized}`,
      difficulty: 'hard',
      category: 'graph',
      rank_tier: rankTier,
      company_tags: ['Google', 'Meta', 'Amazon'],
      description:
        'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.\n\nReturn the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array.',
      examples: [
        {
          input: '2, [[1,0]]',
          output: '[0,1]',
          explanation: 'To take course 1 you should have finished course 0.',
        },
      ],
      constraints: [
        '1 <= numCourses <= 2000',
        '0 <= prerequisites.length <= numCourses * (numCourses - 1)',
      ],
      starter_code: {
        python:
          'class Solution:\n    def findOrder(self, numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n        return []',
        javascript: 'function findOrder(numCourses, prerequisites) {\n    return [];\n}',
        cpp: 'class Solution {\npublic:\n    vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n        return {};\n    }\n};',
        java: 'class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        return new int[0];\n    }\n}',
      },
      test_cases: [
        { input: '2, [[1,0]]', expected_output: '[0,1]', is_hidden: false },
        { input: '4, [[1,0],[2,0],[3,1],[3,2]]', expected_output: '[0,1,2,3]', is_hidden: false },
        { input: '1, []', expected_output: '[0]', is_hidden: false },
        { input: '2, [[0,1],[1,0]]', expected_output: '[]', is_hidden: true },
        { input: '3, [[1,0],[2,1],[0,2]]', expected_output: '[]', is_hidden: true },
      ],
      solution_approach: 'Topological Sort with Kahn algorithm',
      hints: [],
      optimal_complexity: { time: 'O(V + E)', space: 'O(V + E)' },
    };
  }

  if (isMedium) {
    return {
      title: 'Longest Substring Without Repeating Characters',
      slug: `longest-substring-no-repeat-${normalized}`,
      difficulty: 'medium',
      category: 'sliding-window',
      rank_tier: rankTier,
      company_tags: ['Amazon', 'Bloomberg', 'Microsoft'],
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.',
        },
      ],
      constraints: ['0 <= s.length <= 5 * 10^4'],
      starter_code: {
        python:
          'class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        return 0',
        javascript: 'function lengthOfLongestSubstring(s) {\n    return 0;\n}',
        cpp: 'class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        return 0;\n    }\n};',
        java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}',
      },
      test_cases: [
        { input: '"abcabcbb"', expected_output: '3', is_hidden: false },
        { input: '"bbbbb"', expected_output: '1', is_hidden: false },
        { input: '"pwwkew"', expected_output: '3', is_hidden: false },
        { input: '""', expected_output: '0', is_hidden: true },
        { input: '"abcdefghijklmnopqrstuvwxyz"', expected_output: '26', is_hidden: true },
      ],
      solution_approach: 'Sliding window with two pointers',
      hints: [],
      optimal_complexity: { time: 'O(n)', space: 'O(min(n, m))' },
    };
  }

  return {
    title: 'Two Sum',
    slug: 'two-sum-bronze',
    difficulty: 'easy',
    category: 'arrays',
    rank_tier: 'Bronze',
    company_tags: ['Google', 'Meta', 'Apple'],
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0, 1]',
        explanation: 'nums[0] + nums[1] == 9',
      },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9'],
    starter_code: {
      python:
        'class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        return []',
      javascript: 'function twoSum(nums, target) {\n    return [];\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}',
    },
    test_cases: [
      { input: '[2,7,11,15], 9', expected_output: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', expected_output: '[1,2]', is_hidden: false },
      { input: '[3,3], 6', expected_output: '[0,1]', is_hidden: false },
      { input: '[-1,-2,-3,-4,-5], -8', expected_output: '[2,4]', is_hidden: true },
      {
        input: '[1000000000, 500000000, 500000000], 1000000000',
        expected_output: '[1,2]',
        is_hidden: true,
      },
    ],
    solution_approach: 'Hash map for complements in one pass',
    hints: [],
    optimal_complexity: { time: 'O(n)', space: 'O(n)' },
  };
}
