import { NextRequest, NextResponse } from 'next/server';
import { executeCode, runTestCases, TestCase } from '@/lib/judge';
import { checkRateLimit } from '@/lib/llm/rate-limit';
import { requireUser } from '@/lib/supabase/server';
import { getProblemSession } from '@/lib/problems/session';

export async function POST(req: NextRequest) {
  try {
    const { user: authUser, error: authError } = await requireUser();
    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized: login required' },
        { status: 401 }
      );
    }

    const rate = checkRateLimit(`judge-${authUser.id}`, 90);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: `Rate limit exceeded. Try again in ${rate.resetInSec}s` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { code, language, stdin, problemId, problemSessionId, mode, testCases: explicitTestCases } = body;

    if (!code || !language) {
      return NextResponse.json(
        { error: 'Code and language are required' },
        { status: 400 }
      );
    }

    // Determine test suite to execute
    let testCasesToRun: TestCase[] | null = null;

    if (problemSessionId) {
      const sessionProblem = getProblemSession(problemSessionId);
      if (sessionProblem?.test_cases) {
        if (mode === 'submit') {
          // Run visible + hidden test cases
          testCasesToRun = sessionProblem.test_cases;
        } else {
          // Run only visible test cases
          testCasesToRun = sessionProblem.test_cases.filter((t) => !t.is_hidden);
        }
      }
    }

    if (!testCasesToRun && Array.isArray(explicitTestCases) && explicitTestCases.length > 0) {
      testCasesToRun = explicitTestCases;
    }

    if (testCasesToRun && testCasesToRun.length > 0) {
      const result = await runTestCases({
        code,
        language,
        testCases: testCasesToRun,
      });

      // Sanitize hidden test cases so inputs/outputs are never leaked over the wire
      if (mode === 'submit' && result?.test_results) {
        result.test_results = result.test_results.map((r) => {
          if (r.is_hidden) {
            return {
              ...r,
              input: '[Hidden Test Case]',
              expectedOutput: '[Hidden]',
              actualOutput: r.passed ? '[Hidden]' : '[Hidden Failure]',
            };
          }
          return r;
        });
      }

      return NextResponse.json(result);
    }

    const result = await executeCode({ code, language, stdin, problemId });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Judge route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Code execution failed' },
      { status: 500 }
    );
  }
}
