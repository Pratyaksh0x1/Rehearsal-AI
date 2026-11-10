import { z } from 'zod';

export type LLMProvider = 'gemini' | 'deepseek' | 'openrouter' | 'grok';

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateOptions {
  provider?: LLMProvider;
  fallbackOrder?: LLMProvider[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  maxRetries?: number;
  maxSchemaAttempts?: number;
  allowMockFallback?: boolean;
  userId?: string;
  responseFormat?: 'text' | 'json';
}

export interface GenerateResult {
  text: string;
  providerUsed: LLMProvider | 'mock';
  modelUsed: string;
}

const DEFAULT_TIMEOUT_MS = 25000;
const MAX_RETRIES = 2;

/**
 * Main provider-agnostic LLM interface
 */
export async function generate(
  messages: Message[],
  options: GenerateOptions = {}
): Promise<GenerateResult> {
  const primaryProvider =
    options.provider ||
    (process.env.LLM_PROVIDER as LLMProvider) ||
    'gemini';

  const fallbackOrder = options.fallbackOrder || ['gemini', 'deepseek', 'openrouter', 'grok'];
  const orderedProviders = [
    primaryProvider,
    ...fallbackOrder.filter((p) => p !== primaryProvider),
  ];
  const maxRetries = options.maxRetries ?? MAX_RETRIES;

  let lastError: Error | null = null;

  for (const provider of orderedProviders) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await executeProvider(provider, messages, options);
        if (result) return result;
      } catch (err: any) {
        lastError = err;
        console.warn(`[LLM] Provider ${provider} attempt ${attempt + 1} failed:`, err?.message || err);
        if (
          err?.message?.includes('401') ||
          err?.message?.includes('404') ||
          err?.message?.includes('403') ||
          err?.message?.includes('400') ||
          err?.message?.includes('RESOURCE_EXHAUSTED') ||
          err?.message?.includes('quota exceeded') ||
          err?.message?.includes('QuotaExceeded')
        ) {
          // Fatal auth/quota limit error, immediately switch to the next fallback provider
          break;
        }
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
        }
      }
    }
  }

  // If no providers are configured or all remote calls failed, use smart mock fallback
  if (options.allowMockFallback === false) {
    throw lastError || new Error('No configured LLM provider returned a response.');
  }
  console.error('[LLM] ALL providers failed or unconfigured -> returning MOCK reply. Last error:', lastError?.message || 'no API key set');
  return getMockResponse(messages, options);
}

/**
 * Streaming LLM interface: yields token / chunk deltas as they are generated.
 * Falls back to generate() if streaming is unsupported or encounters an error.
 */
export async function* generateStream(
  messages: Message[],
  options: GenerateOptions = {}
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  const primaryProvider =
    options.provider ||
    (process.env.LLM_PROVIDER as LLMProvider) ||
    'gemini';

  if (primaryProvider === 'gemini' && apiKey) {
    try {
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const m of messages.filter((x) => x.role !== 'system')) {
        const role = m.role === 'assistant' ? 'model' : 'user';
        const last = contents[contents.length - 1];
        if (last && last.role === role) last.parts[0].text += `\n${m.content}`;
        else contents.push({ role, parts: [{ text: m.content }] });
      }
      if (contents.length === 0 || contents[0].role !== 'user') {
        contents.unshift({ role: 'user', parts: [{ text: '(The session has started.)' }] });
      }
      const systemInstruction = messages.find((m) => m.role === 'system');

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction.content }] }
              : undefined,
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 1024,
            },
          }),
        }
      );

      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let yieldedAny = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                try {
                  const parsed = JSON.parse(jsonStr);
                  const text = (parsed.candidates?.[0]?.content?.parts || [])
                    .map((p: any) => p?.text || '')
                    .join('');
                  if (text) {
                    yieldedAny = true;
                    yield text;
                  }
                } catch {
                  // ignore malformed SSE line
                }
              }
            }
          }
        }

        if (yieldedAny) return;
      }
    } catch (streamErr) {
      console.warn('[LLM Stream] Gemini stream error, falling back to generate():', streamErr);
    }
  } else if (
    primaryProvider === 'deepseek' ||
    primaryProvider === 'openrouter' ||
    primaryProvider === 'grok'
  ) {
    let streamApiKey = '';
    let streamEndpoint = '';
    let streamModel = '';
    const extraHeaders: Record<string, string> = {};

    if (primaryProvider === 'deepseek') {
      streamApiKey = process.env.DEEPSEEK_API_KEY || '';
      streamEndpoint = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
      streamModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    } else if (primaryProvider === 'openrouter') {
      streamApiKey = process.env.OPENROUTER_API_KEY || '';
      streamEndpoint = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
      streamModel = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
      extraHeaders['HTTP-Referer'] = 'https://rehearsal-ai.com';
      extraHeaders['X-Title'] = 'Rehearsal AI';
    } else {
      streamApiKey = process.env.GROK_API_KEY || '';
      streamEndpoint = 'https://api.x.ai/v1/chat/completions';
      streamModel = process.env.GROK_MODEL || 'grok-beta';
    }

    if (streamApiKey) {
      try {
        const res = await fetch(streamEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${streamApiKey}`,
            ...extraHeaders,
          },
          body: JSON.stringify({
            model: streamModel,
            messages: messages.map((m) => ({ role: m.role, content: m.content })),
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 1024,
            stream: true,
          }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let yieldedAny = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const jsonStr = trimmed.slice(6).trim();
                if (jsonStr === '[DONE]') break;
                try {
                  const parsed = JSON.parse(jsonStr);
                  const token = parsed.choices?.[0]?.delta?.content || '';
                  if (token) {
                    yieldedAny = true;
                    yield token;
                  }
                } catch {}
              }
            }
          }

          if (yieldedAny) return;
        }
      } catch (streamErr) {
        console.warn(`[LLM Stream] ${primaryProvider} stream notice, falling back to generate():`, streamErr);
      }
    }
  }

  // Fallback: use standard generate and yield the full text
  const full = await generate(messages, options);
  yield full.text;
}

/**
 * Execute call to specific provider
 */
async function executeProvider(
  provider: LLMProvider,
  messages: Message[],
  options: GenerateOptions
): Promise<GenerateResult | null> {
  const timeoutMs = options.timeoutMs || DEFAULT_TIMEOUT_MS;

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    const model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';

    // Gemini wants: first turn = user, roles alternate. Merge same-role runs and prepend a user turn if needed.
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
    for (const m of messages.filter((x) => x.role !== 'system')) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const last = contents[contents.length - 1];
      if (last && last.role === role) last.parts[0].text += `\n${m.content}`;
      else contents.push({ role, parts: [{ text: m.content }] });
    }
    if (contents.length === 0 || contents[0].role !== 'user') {
      contents.unshift({ role: 'user', parts: [{ text: '(The session has started.)' }] });
    }

    const systemInstruction = messages.find((m) => m.role === 'system');

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents,
            systemInstruction: systemInstruction
              ? { parts: [{ text: systemInstruction.content }] }
              : undefined,
            generationConfig: {
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 2048,
              responseMimeType:
                options.responseFormat === 'json' ? 'application/json' : 'text/plain',
              // 2.5 "thinking" tokens eat maxOutputTokens and can leave the reply empty for short voice answers.
              ...(model.includes('2.5-flash') ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
            },
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = (data.candidates?.[0]?.content?.parts || [])
        .map((p: any) => p?.text || '')
        .join('')
        .trim();
      if (!text) throw new Error(`Gemini returned an empty reply (finishReason: ${data.candidates?.[0]?.finishReason})`);
      return { text, providerUsed: 'gemini', modelUsed: model };
    } finally {
      clearTimeout(timer);
    }
  }

  if (provider === 'deepseek' || provider === 'openrouter' || provider === 'grok') {
    let apiKey: string | undefined;
    let endpoint: string;
    let model: string;
    const extraHeaders: Record<string, string> = {};

    if (provider === 'deepseek') {
      apiKey = process.env.DEEPSEEK_API_KEY;
      endpoint = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/chat/completions';
      model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
    } else if (provider === 'openrouter') {
      apiKey = process.env.OPENROUTER_API_KEY;
      endpoint = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1/chat/completions';
      model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';
      extraHeaders['HTTP-Referer'] = 'https://rehearsal-ai.com';
      extraHeaders['X-Title'] = 'Rehearsal AI';
    } else {
      apiKey = process.env.GROK_API_KEY;
      endpoint = 'https://api.x.ai/v1/chat/completions';
      model = process.env.GROK_MODEL || 'grok-beta';
    }

    if (!apiKey) return null;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          ...extraHeaders,
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 2048,
          response_format:
            options.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`${provider.toUpperCase()} API error ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = (data.choices?.[0]?.message?.content || '').trim();
      if (!text) throw new Error(`${provider.toUpperCase()} returned an empty reply`);
      return { text, providerUsed: provider, modelUsed: model };
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

/**
 * Strict JSON validation with Zod schema and retry loop
 */
export async function generateWithSchema<T>(
  messages: Message[],
  schema: z.ZodSchema<T>,
  options: GenerateOptions = {}
): Promise<{ data: T; raw: string; providerUsed: string }> {
  let attempts = 0;
  const maxSchemaAttempts = options.maxSchemaAttempts ?? 2;

  while (attempts <= maxSchemaAttempts) {
    attempts++;
    const res = await generate(messages, { ...options, responseFormat: 'json' });

    try {
      // Strip markdown code fences if present (e.g. ```json ... ```)
      let cleaned = res.text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/, '');
      }

      const parsedJson = JSON.parse(cleaned);
      const validated = schema.parse(parsedJson);
      return { data: validated, raw: res.text, providerUsed: res.providerUsed };
    } catch (parseError: any) {
      console.warn(`[LLM Schema Validation] Attempt ${attempts} failed:`, parseError?.message);
      if (attempts <= maxSchemaAttempts) {
        messages = [
          ...messages,
          { role: 'assistant', content: res.text },
          {
            role: 'user',
            content: `Your previous response did not match the required JSON schema: ${parseError.message}. Please respond ONLY with valid JSON matching the exact schema without any explanation.`,
          },
        ];
      }
    }
  }

  throw new Error('Failed to generate valid structured JSON response from LLM.');
}

/**
 * Intelligent Mock responses when API keys have not yet been attached
 */
function getMockResponse(messages: Message[], options: GenerateOptions): GenerateResult {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')?.content.toLowerCase() || '';

  if (options.responseFormat === 'json') {
    if (lastUserMsg.includes('resume') || messages.some((m) => m.content.includes('Resume Review'))) {
      return {
        text: JSON.stringify({
          score: 84,
          sectionWiseNotes: {
            summary: 'Clear professional summary with strong emphasis on software engineering.',
            skills: 'Great breadth of technical languages and frameworks (React, Node, TypeScript, Docker).',
            projects: 'Relevant projects showcased with GitHub repositories, though quantitative metrics can be improved.',
            experience: 'Solid progression. Strong demonstration of full-stack feature delivery.',
            education: 'Accurately formatted degree details.',
            formattingAts: 'Clean single-column ATS-friendly layout. Standard font hierarchy.',
          },
          topChanges: [
            'Quantify project outcomes (e.g., "Reduced latency by 35% with Redis caching").',
            'Lead with high-impact action verbs like Architected, Specced, Automated.',
            'Group skills into Languages, Frameworks, and Cloud Tools for faster scanning.',
          ],
          rewrittenBullets: [
            {
              original: 'Built a web dashboard for user metrics.',
              improved: 'Architected an automated analytics dashboard utilizing Next.js and Postgres, scaling to 15k DAU.',
            },
            {
              original: 'Handled bugs and fixed API issues.',
              improved: 'Remediated 40+ high-severity API performance bottlenecks, reducing p99 latency from 420ms to 85ms.',
            },
          ],
        }),
        providerUsed: 'mock',
        modelUsed: 'mock-evaluator-v1',
      };
    }

    if (lastUserMsg.includes('hr') || messages.some((m) => m.content.includes('behavioral'))) {
      return {
        text: JSON.stringify({
          communicationScore: 88,
          starStructureScore: 82,
          confidenceClarityScore: 85,
          relevanceScore: 90,
          strengths: [
            'Articulate explanation of cross-functional team collaboration.',
            'Directly answered the core premise of handling competing priorities.',
            'Demonstrated clear ownership and accountability.',
          ],
          improvements: [
            'Elaborate more deeply on the measurable Result (R) in the STAR format.',
            'Mention specific trade-offs made during high-pressure deadlines.',
          ],
          overallFeedback: 'Strong behavioral performance. Candidate exhibits mature ownership and clear communication.',
        }),
        providerUsed: 'mock',
        modelUsed: 'mock-evaluator-v1',
      };
    }

    if (
      lastUserMsg.includes('problem') ||
      lastUserMsg.includes('dsa') ||
      lastUserMsg.includes('rank tier') ||
      messages.some((m) => m.content.includes('coding interview problem'))
    ) {
      const isHard =
        lastUserMsg.includes('diamond') ||
        lastUserMsg.includes('crown') ||
        lastUserMsg.includes('conqueror');
      const isMedium =
        lastUserMsg.includes('gold') || lastUserMsg.includes('platinum');

      let tierName = 'Bronze';
      if (lastUserMsg.includes('gold')) tierName = 'Gold';
      else if (lastUserMsg.includes('platinum')) tierName = 'Platinum';
      else if (lastUserMsg.includes('diamond')) tierName = 'Diamond';
      else if (lastUserMsg.includes('crown')) tierName = 'Crown';
      else if (lastUserMsg.includes('conqueror')) tierName = 'Conqueror';

      if (isHard) {
        return {
          text: JSON.stringify({
            title: 'Course Schedule II',
            slug: `course-schedule-ii-${tierName.toLowerCase()}`,
            difficulty: 'hard',
            category: 'graphs',
            rank_tier: tierName,
            company_tags: ['Google', 'Meta', 'Amazon'],
            description:
              'There are a total of numCourses courses labeled from 0 to numCourses - 1. Return the ordering of courses you should take to finish all courses using topological sort.',
            examples: [
              {
                input: 'numCourses = 2, prerequisites = [[1,0]]',
                output: '[0, 1]',
                explanation: 'Course 0 must be taken before course 1.',
              },
            ],
            constraints: ['1 <= numCourses <= 2000'],
            starter_code: {
              python: 'def findOrder(numCourses: int, prerequisites: list[list[int]]) -> list[int]:\n    pass',
              javascript: 'function findOrder(numCourses, prerequisites) {\n}',
              cpp: 'vector<int> findOrder(int numCourses, vector<vector<int>>& prerequisites) {\n}',
              java: 'class Solution {\n    public int[] findOrder(int numCourses, int[][] prerequisites) {\n        return new int[0];\n    }\n}',
            },
            test_cases: [
              { input: '2, [[1,0]]', expected_output: '[0,1]', is_hidden: false },
              { input: '4, [[1,0],[2,0],[3,1],[3,2]]', expected_output: '[0,1,2,3]', is_hidden: false },
              { input: '1, []', expected_output: '[0]', is_hidden: false },
              { input: '2, [[0,1],[1,0]]', expected_output: '[]', is_hidden: true },
              { input: '3, [[1,0],[2,1],[0,2]]', expected_output: '[]', is_hidden: true },
            ],
            solution_approach: 'Kahn algorithm for Topological Sort with in-degrees.',
            hints: ['Model as directed graph', 'Track in-degrees', 'Process queue with 0 in-degree'],
            optimal_complexity: { time: 'O(V + E)', space: 'O(V + E)' },
            follow_up_questions: ['How to handle parallel dependency building?'],
          }),
          providerUsed: 'mock',
          modelUsed: 'mock-evaluator-v1',
        };
      }

      if (isMedium) {
        return {
          text: JSON.stringify({
            title: 'Longest Substring Without Repeating Characters',
            slug: `longest-substring-no-repeat-${tierName.toLowerCase()}`,
            difficulty: 'medium',
            category: 'sliding-window',
            rank_tier: tierName,
            company_tags: ['Amazon', 'Bloomberg', 'Microsoft'],
            description:
              'Given a string s, find the length of the longest substring without repeating characters.',
            examples: [
              { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", length 3.' },
            ],
            constraints: ['0 <= s.length <= 50000'],
            starter_code: {
              python: 'def lengthOfLongestSubstring(s: str) -> int:\n    pass',
              javascript: 'function lengthOfLongestSubstring(s) {\n}',
              cpp: 'int lengthOfLongestSubstring(string s) {\n    return 0;\n}',
              java: 'class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        return 0;\n    }\n}',
            },
            test_cases: [
              { input: '"abcabcbb"', expected_output: '3', is_hidden: false },
              { input: '"bbbbb"', expected_output: '1', is_hidden: false },
              { input: '"pwwkew"', expected_output: '3', is_hidden: false },
              { input: '""', expected_output: '0', is_hidden: true },
              { input: '"abcdefghijklmnopqrstuvwxyz"', expected_output: '26', is_hidden: true },
            ],
            solution_approach: 'Sliding window with two pointers and a character set.',
            hints: ['Expand window right', 'Shrink window left on duplicate', 'Use hash set'],
            optimal_complexity: { time: 'O(n)', space: 'O(min(n, m))' },
            follow_up_questions: ['What if character set includes Unicode?'],
          }),
          providerUsed: 'mock',
          modelUsed: 'mock-evaluator-v1',
        };
      }

      // Bronze default
      return {
        text: JSON.stringify({
          title: 'Two Sum',
          slug: 'two-sum-bronze',
          difficulty: 'easy',
          category: 'arrays',
          rank_tier: 'Bronze',
          company_tags: ['Google', 'Meta', 'Apple'],
          description:
            'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          examples: [
            { input: 'nums = [2,7,11,15], target = 9', output: '[0, 1]', explanation: 'nums[0] + nums[1] == 9' },
          ],
          constraints: ['2 <= nums.length <= 10000'],
          starter_code: {
            python: 'def twoSum(nums: list[int], target: int) -> list[int]:\n    pass',
            javascript: 'function twoSum(nums, target) {\n}',
            cpp: 'vector<int> twoSum(vector<int>& nums, int target) {\n    return {};\n}',
            java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        return new int[0];\n    }\n}',
          },
          test_cases: [
            { input: '[2,7,11,15], 9', expected_output: '[0,1]', is_hidden: false },
            { input: '[3,2,4], 6', expected_output: '[1,2]', is_hidden: false },
            { input: '[3,3], 6', expected_output: '[0,1]', is_hidden: false },
            { input: '[-1,-2,-3,-4,-5], -8', expected_output: '[2,4]', is_hidden: true },
            { input: '[1000000000, 500000000, 500000000], 1000000000', expected_output: '[1,2]', is_hidden: true },
          ],
          solution_approach: 'Hash map of seen values to indices for O(1) complement lookup.',
          hints: ['Think of complement target - x', 'Use hash map for O(1) lookups', 'Single pass'],
          optimal_complexity: { time: 'O(n)', space: 'O(n)' },
          follow_up_questions: ['What if nums is already sorted?'],
        }),
        providerUsed: 'mock',
        modelUsed: 'mock-evaluator-v1',
      };
    }

    // Default technical round scoring
    return {
      text: JSON.stringify({
        score: 86,
        correctness: 90,
        approach: 88,
        complexityAnalysis: 85,
        communication: 82,
        feedback:
          'Excellent problem breakdown. You correctly identified the optimal time complexity using a hash map and handled boundary constraints smoothly.',
        timeComplexity: 'O(N)',
        spaceComplexity: 'O(N)',
        passed: true,
      }),
      providerUsed: 'mock',
      modelUsed: 'mock-evaluator-v1',
    };
  }

  // Conversational response
  if (lastUserMsg.includes('approach') || lastUserMsg.includes('start') || messages.length <= 2) {
    return {
      text: "Welcome to the technical round! Before writing any code, walk me through your initial thoughts on this problem. What data structures or approaches come to mind, and what are the time/space complexities you'd aim for?",
      providerUsed: 'mock',
      modelUsed: 'mock-interviewer-v1',
    };
  }

  return {
    text: "That sounds like a solid direction! Could you consider any edge cases, such as empty inputs or negative values? Feel free to start implementing your solution in the editor whenever you're ready.",
    providerUsed: 'mock',
    modelUsed: 'mock-interviewer-v1',
  };
}
