import { z } from 'zod';
import { generateWithSchema, generate } from '@/lib/llm';
import { db, isDatabaseConfigured } from '@/db';
import { problems } from '@/db/schema';
import * as fs from 'fs';
import * as path from 'path';

export const GeneratedProblemSchema = z.object({
  title: z.string(),
  slug: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string(),
  rank_tier: z.enum(['Bronze', 'Gold', 'Platinum', 'Diamond', 'Crown', 'Conqueror']),
  company_tags: z.array(z.string()).default(['Google', 'Amazon']),
  description: z.string(),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string().optional(),
    })
  ),
  constraints: z.array(z.string()),
  starter_code: z.object({
    python: z.string(),
    javascript: z.string(),
    cpp: z.string(),
    java: z.string(),
  }),
  test_cases: z.array(
    z.object({
      input: z.string(),
      expected_output: z.string(),
      is_hidden: z.boolean(),
    })
  ),
  solution_approach: z.string(),
  hints: z.array(z.string()).default([]),
  optimal_complexity: z.object({
    time: z.string(),
    space: z.string(),
  }),
  follow_up_questions: z.array(z.string()).default([]),
});

export type GeneratedProblem = z.infer<typeof GeneratedProblemSchema>;

const PROBLEMS_DIR = path.join(process.cwd(), 'src/data/problems');

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
    description: 'Intermediate problem patterns testing linear scans with multiple pointers and monotonic buffers.',
  },
  Platinum: {
    difficulty: 'medium',
    topics: ['binary-trees', 'linked-lists', 'backtracking', 'recursion', 'graphs-bfs'],
    description: 'Subproblem decomposition with recursion, pointer manipulation, and level-order tree traversal.',
  },
  Diamond: {
    difficulty: 'hard',
    topics: ['dynamic-programming', 'graph-dfs-bfs', 'topological-sort', 'union-find'],
    description: 'Advanced state transitions, shortest paths, topological sort, and optimal memoization.',
  },
  Crown: {
    difficulty: 'hard',
    topics: ['2d-dynamic-programming', 'tries', 'dijkstra', 'segment-trees'],
    description: 'FAANG Hard & Codeforces 1500+ complexity requiring multi-dimensional DP and tree prefixes.',
  },
  Conqueror: {
    difficulty: 'hard',
    topics: ['monotonic-queue', 'bitmask-dp', 'network-flow', 'range-queries'],
    description: 'Elite competitive programming problems testing monotonic queues, state compression, and optimal amortized Big-O.',
  },
};

/**
 * Generates a full DSA problem for the candidate's exact rank tier
 * Includes: 3 visible test cases + 2 hidden edge test cases
 */
export async function generateProblemForRank(
  rankTier: string,
  preferredCategory?: string
): Promise<GeneratedProblem> {
  const tierKey = (rankTier.charAt(0).toUpperCase() + rankTier.slice(1).toLowerCase()) as
    | 'Bronze'
    | 'Gold'
    | 'Platinum'
    | 'Diamond'
    | 'Crown'
    | 'Conqueror';

  const spec = RANK_TOPIC_SPECS[tierKey] || RANK_TOPIC_SPECS.Bronze;
  const chosenCategory =
    preferredCategory || spec.topics[Math.floor(Math.random() * spec.topics.length)];

  const systemPrompt = `You are a Senior FAANG Interview Problem Designer for Rehearsal AI.
Your task is to generate a realistic, high-quality coding interview problem calibrated for the "${tierKey}" rank tier (${spec.difficulty} difficulty, category: ${chosenCategory}).

Strict Requirements:
1. "test_cases": MUST contain exactly 5 test cases:
   - 3 visible test cases with "is_hidden": false (standard cases displayed in candidate runner)
   - 2 hidden edge cases with "is_hidden": true (e.g. empty input, single element, negative numbers, extreme constraints)
2. "starter_code": Must compile in all 4 languages (python, javascript, cpp, java).
   - In Python, use: def solution(...):
   - In JS, use: function solution(...)
   - In C++, provide valid function declaration.
   - In Java, provide public class Solution.
3. "rank_tier": exactly "${tierKey}".
4. Return valid JSON strictly matching the schema. No hints should be included ("hints": []).`;

  const userPrompt = `Generate a single complete DSA interview problem for rank tier ${tierKey}.
Difficulty: ${spec.difficulty}
Category: ${chosenCategory}
Context: ${spec.description}`;

  try {
    const result = await generateWithSchema(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      GeneratedProblemSchema
    );

    const problemData = result.data as GeneratedProblem;
    await saveGeneratedProblem(problemData);
    return problemData;
  } catch (err) {
    console.warn(`[ProblemGenerator] LLM generation failed for ${tierKey}, falling back to rank template:`, err);
    const fallback = getFallbackProblemForRank(tierKey, chosenCategory);
    await saveGeneratedProblem(fallback);
    return fallback;
  }
}

/**
 * Persists the generated problem to disk and Supabase PostgreSQL
 */
export async function saveGeneratedProblem(problem: GeneratedProblem | any): Promise<void> {
  try {
    // 1. Save JSON to disk
    if (!fs.existsSync(PROBLEMS_DIR)) {
      fs.mkdirSync(PROBLEMS_DIR, { recursive: true });
    }
    const filePath = path.join(PROBLEMS_DIR, `${problem.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(problem, null, 2), 'utf-8');

    // 2. Sync to Supabase PostgreSQL table
    if (isDatabaseConfigured() && db) {
      await db
        .insert(problems)
        .values({
          id: `gen_${problem.slug}`,
          source: 'Rehearsal AI',
          externalId: problem.slug,
          title: problem.title,
          url: `https://rehearsal.ai/problems/${problem.slug}`,
          difficulty: problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1),
          topics: [problem.category, ...(problem.company_tags || [])],
          rankTier: problem.rank_tier,
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    console.error('Error saving generated problem:', err);
  }
}

/**
 * High-quality deterministic fallback problem per rank tier if LLM is offline
 */
export function getFallbackProblemForRank(
  rankTier: string,
  category: string
): GeneratedProblem {
  const isHard = ['Diamond', 'Crown', 'Conqueror'].includes(rankTier);
  const isMedium = ['Gold', 'Platinum'].includes(rankTier);

  if (isHard) {
    return {
      title: 'Course Schedule II',
      slug: `course-schedule-ii-${rankTier.toLowerCase()}`,
      difficulty: 'hard',
      category: 'graphs',
      rank_tier: rankTier as any,
      company_tags: ['Google', 'Meta', 'Amazon'],
      description: `There are a total of \`numCourses\` courses you have to take, labeled from \`0\` to \`numCourses - 1\`. You are given an array \`prerequisites\` where \`prerequisites[i] = [a_i, b_i]\` indicates that you must take course \`b_i\` first if you want to take course \`a_i\`.

Return the ordering of courses you should take to finish all courses. If there are many valid answers, return any of them. If it is impossible to finish all courses, return an empty array.`,
      examples: [
        {
          input: 'numCourses = 2, prerequisites = [[1,0]]',
          output: '[0, 1]',
          explanation: 'There are a total of 2 courses. To take course 1 you should have finished course 0. So the correct course order is [0, 1].',
        },
        {
          input: 'numCourses = 4, prerequisites = [[1,0],[2,0],[3,1],[3,2]]',
          output: '[0, 1, 2, 3]',
          explanation: 'Both [0, 1, 2, 3] and [0, 2, 1, 3] are valid.',
        },
      ],
      constraints: ['1 <= numCourses <= 2000', '0 <= prerequisites.length <= numCourses * (numCourses - 1)'],
      starter_code: {
        python: 'def findOrder(numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n    # Write your solution here\n    pass',
        javascript: 'function findOrder(numCourses, prerequisites) {\n  // Write your solution here\n}',
        cpp: 'vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n    // Write your solution here\n}',
        java: 'class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        return new int[0];\n    }\n}',
      },
      test_cases: [
        { input: '2, [[1,0]]', expected_output: '[0,1]', is_hidden: false },
        { input: '4, [[1,0],[2,0],[3,1],[3,2]]', expected_output: '[0,1,2,3]', is_hidden: false },
        { input: '1, []', expected_output: '[0]', is_hidden: false },
        { input: '2, [[0,1],[1,0]]', expected_output: '[]', is_hidden: true }, // Hidden cycle edge case
        { input: '3, [[1,0],[2,1],[0,2]]', expected_output: '[]', is_hidden: true }, // Hidden 3-node cycle
      ],
      solution_approach: 'Use Kahn algorithm for Topological Sort with in-degree tracking and a queue.',
      hints: [],
      optimal_complexity: { time: 'O(V + E)', space: 'O(V + E)' },
      follow_up_questions: ['How would you modify this to detect all cycles in a distributed build dependency graph?'],
    };
  }

  if (isMedium) {
    return {
      title: 'Longest Substring Without Repeating Characters',
      slug: `longest-substring-no-repeat-${rankTier.toLowerCase()}`,
      difficulty: 'medium',
      category: 'sliding-window',
      rank_tier: rankTier as any,
      company_tags: ['Amazon', 'Bloomberg', 'Microsoft'],
      description: 'Given a string `s`, find the length of the longest substring without repeating characters.',
      examples: [
        { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
        { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      ],
      constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
      starter_code: {
        python: 'def lengthOfLongestSubstring(s: str) -> int:\n    # Write your solution here\n    pass',
        javascript: 'function lengthOfLongestSubstring(s) {\n  // Write your solution here\n}',
        cpp: 'int lengthOfLongestSubstring(string s) {\n    // Write your solution here\n    return 0;\n}',
        java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}',
      },
      test_cases: [
        { input: '"abcabcbb"', expected_output: '3', is_hidden: false },
        { input: '"bbbbb"', expected_output: '1', is_hidden: false },
        { input: '"pwwkew"', expected_output: '3', is_hidden: false },
        { input: '""', expected_output: '0', is_hidden: true }, // Hidden empty edge case
        { input: '"abcdefghijklmnopqrstuvwxyz"', expected_output: '26', is_hidden: true }, // Hidden full alphabet
      ],
      solution_approach: 'Use a sliding window with two pointers [left, right] and a hash set or last-seen index map.',
      hints: [],
      optimal_complexity: { time: 'O(n)', space: 'O(min(n, m))' },
      follow_up_questions: ['What if the character set includes unicode emojis and UTF-8 multibyte glyphs?'],
    };
  }

  // Bronze default
  return {
    title: 'Two Sum',
    slug: 'two-sum-bronze',
    difficulty: 'easy',
    category: 'arrays',
    rank_tier: 'Bronze',
    company_tags: ['Google', 'Meta', 'Apple'],
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1, 2]', explanation: 'nums[1] + nums[2] == 6, we return [1, 2].' },
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
    starter_code: {
      python: 'def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    pass',
      javascript: 'function twoSum(nums, target) {\n  // Write your solution here\n}',
      cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {};\n}',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}',
    },
    test_cases: [
      { input: '[2,7,11,15], 9', expected_output: '[0,1]', is_hidden: false },
      { input: '[3,2,4], 6', expected_output: '[1,2]', is_hidden: false },
      { input: '[3,3], 6', expected_output: '[0,1]', is_hidden: false },
      { input: '[-1,-2,-3,-4,-5], -8', expected_output: '[2,4]', is_hidden: true }, // Hidden negative numbers edge case
      { input: '[1000000000, 500000000, 500000000], 1000000000', expected_output: '[1,2]', is_hidden: true }, // Hidden large integers
    ],
    solution_approach: 'Use a hash map to store elements seen so far and their indices. For each element x, check if (target - x) is in the map.',
    hints: [],
    optimal_complexity: { time: 'O(n)', space: 'O(n)' },
    follow_up_questions: ['What if the input array is already sorted?'],
  };
}
