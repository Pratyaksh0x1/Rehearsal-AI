import { compareOutput } from './comparator';
import { buildExecutableCode } from './harness';
import { runLocalSandbox } from './localRunner';

export interface ExecutionRequest {
  code: string;
  language: string;
  stdin?: string;
  problemId?: string;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

export interface TestCaseResult {
  testNumber: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  passed: boolean;
  timeMs: number;
  is_hidden?: boolean;
  error?: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
  memoryKb?: number;
  status:
    | 'Accepted'
    | 'Wrong Answer'
    | 'Time Limit Exceeded'
    | 'Runtime Error'
    | 'Compilation Error';
  passedAllTests: boolean;
  totalTests?: number;
  passedTests?: number;
  test_results?: TestCaseResult[];
}

const PISTON_LANG_MAP: Record<string, { language: string; version: string }> = {
  python: { language: 'python', version: '3.10.0' },
  javascript: { language: 'javascript', version: '18.15.0' },
  typescript: { language: 'typescript', version: '5.0.3' },
  cpp: { language: 'c++', version: '10.2.0' },
  java: { language: 'java', version: '15.0.2' },
};

/**
 * Sandboxed code execution
 * Prioritizes remote Piston when available; seamlessly falls back to isolated local sandbox runner.
 * Never fabricates mock results.
 */
export async function executeCode(req: ExecutionRequest): Promise<ExecutionResult> {
  const judgeUrl = process.env.JUDGE_SERVICE_URL;
  const judgeApiKey = process.env.JUDGE_API_KEY;
  const langConfig = PISTON_LANG_MAP[req.language.toLowerCase()] || PISTON_LANG_MAP.python;

  // 1. Try Remote Piston if endpoint is provided and not public whitelist-blocked
  if (judgeUrl && !judgeUrl.includes('sample-project')) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(judgeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(judgeApiKey ? { Authorization: judgeApiKey, 'x-api-key': judgeApiKey } : {}),
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [{ content: req.code }],
          stdin: req.stdin || '',
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const data = await res.json();
        if (data.run) {
          const run = data.run;
          const stdout = run.stdout || '';
          const stderr = run.stderr || data.compile?.stderr || '';
          const exitCode = run.code ?? (stderr ? 1 : 0);

          return {
            stdout,
            stderr,
            exitCode,
            timeMs: 110,
            status: exitCode === 0 ? 'Accepted' : 'Runtime Error',
            passedAllTests: exitCode === 0 && !stderr,
          };
        }
      }
    } catch {
      // Remote unavailable, proceed to local sandbox
    }
  }

  // 2. Local Sandboxed Execution
  try {
    const localRes = await runLocalSandbox({
      code: req.code,
      language: req.language,
      stdin: req.stdin || '',
      timeoutMs: 6000,
    });

    const isTimeLimit = localRes.timedOut;
    const isCompileErr =
      localRes.stderr.includes('compilation failed') ||
      localRes.stderr.includes('SyntaxError');

    const status = isTimeLimit
      ? 'Time Limit Exceeded'
      : isCompileErr
      ? 'Compilation Error'
      : localRes.exitCode === 0
      ? 'Accepted'
      : 'Runtime Error';

    return {
      stdout: localRes.stdout,
      stderr: localRes.stderr,
      exitCode: localRes.exitCode,
      timeMs: localRes.timeMs,
      status,
      passedAllTests: localRes.exitCode === 0 && !localRes.stderr,
    };
  } catch (localErr: any) {
    return {
      stdout: '',
      stderr: localErr?.message || 'Execution failed',
      exitCode: 503,
      timeMs: 0,
      status: 'Runtime Error',
      passedAllTests: false,
    };
  }
}

/**
 * Runs user code against a suite of test cases (visible or visible + hidden).
 * Wraps code with the function test harness if applicable.
 */
export async function runTestCases({
  code,
  language,
  testCases,
}: {
  code: string;
  language: string;
  testCases: TestCase[];
}): Promise<ExecutionResult> {
  if (!testCases || testCases.length === 0) {
    return executeCode({ code, language });
  }

  const executableCode = buildExecutableCode(code, language);
  const testResults: TestCaseResult[] = [];
  let totalTimeMs = 0;
  let overallStatus: ExecutionResult['status'] = 'Accepted';
  let firstStderr = '';

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const execRes = await executeCode({
      code: executableCode,
      language,
      stdin: tc.input,
    });

    totalTimeMs += execRes.timeMs;

    if (execRes.exitCode === 503) {
      return {
        stdout: '',
        stderr: 'Execution sandbox is temporarily unreachable. Please retry.',
        exitCode: 503,
        timeMs: 0,
        status: 'Runtime Error',
        passedAllTests: false,
        totalTests: testCases.length,
        passedTests: 0,
        test_results: [],
      };
    }

    if (execRes.status === 'Compilation Error') {
      return {
        stdout: execRes.stdout,
        stderr: execRes.stderr,
        exitCode: execRes.exitCode,
        timeMs: execRes.timeMs,
        status: 'Compilation Error',
        passedAllTests: false,
        totalTests: testCases.length,
        passedTests: 0,
        test_results: [
          {
            testNumber: i + 1,
            input: tc.input,
            expectedOutput: tc.expected_output,
            actualOutput: execRes.stdout,
            passed: false,
            timeMs: execRes.timeMs,
            is_hidden: tc.is_hidden,
            error: execRes.stderr,
          },
        ],
      };
    }

    const stdoutClean = execRes.stdout.trim();
    const stdoutLines = stdoutClean.split('\n').map((l) => l.trim()).filter(Boolean);
    const lastStdoutLine = stdoutLines.length > 0 ? stdoutLines[stdoutLines.length - 1] : '';

    const isMatch =
      execRes.exitCode === 0 &&
      (compareOutput(stdoutClean, tc.expected_output) ||
        (lastStdoutLine && compareOutput(lastStdoutLine, tc.expected_output)));

    if (!isMatch) {
      if (execRes.status === 'Time Limit Exceeded') {
        overallStatus = 'Time Limit Exceeded';
      } else if (execRes.exitCode !== 0) {
        overallStatus = 'Runtime Error';
        if (!firstStderr) firstStderr = execRes.stderr;
      } else if (overallStatus === 'Accepted') {
        overallStatus = 'Wrong Answer';
      }
    }

    const actualOutputResolved = isMatch
      ? (compareOutput(lastStdoutLine, tc.expected_output) ? lastStdoutLine : stdoutClean)
      : (stdoutClean || (execRes.stderr ? execRes.stderr.trim() : ''));

    testResults.push({
      testNumber: i + 1,
      input: tc.input,
      expectedOutput: tc.expected_output,
      actualOutput: actualOutputResolved,
      passed: Boolean(isMatch),
      timeMs: execRes.timeMs,
      is_hidden: tc.is_hidden,
      error: execRes.stderr || undefined,
    });
  }

  const passedTests = testResults.filter((t) => t.passed).length;
  const passedAllTests = passedTests === testCases.length;

  return {
    stdout: `Ran ${testCases.length} test cases: ${passedTests}/${testCases.length} passed.`,
    stderr: firstStderr,
    exitCode: passedAllTests ? 0 : 1,
    timeMs: Math.round(totalTimeMs / testCases.length),
    status: passedAllTests ? 'Accepted' : overallStatus,
    passedAllTests,
    totalTests: testCases.length,
    passedTests,
    test_results: testResults,
  };
}
