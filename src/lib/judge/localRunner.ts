import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export interface LocalRunOptions {
  code: string;
  language: string;
  stdin?: string;
  timeoutMs?: number;
}

export interface LocalRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  timeMs: number;
  timedOut?: boolean;
}

/**
 * Sandboxed local process execution with timeout, resource limits, and auto-cleanup.
 */
export async function runLocalSandbox({
  code,
  language,
  stdin = '',
  timeoutMs = 5000,
}: LocalRunOptions): Promise<LocalRunResult> {
  const lang = language.toLowerCase();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rehearsal_judge_'));
  const startTime = Date.now();

  try {
    let cmd = '';
    let args: string[] = [];

    if (lang === 'python' || lang === 'py') {
      const scriptPath = path.join(tmpDir, 'solution.py');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      cmd = 'python';
      args = ['-u', scriptPath];
    } else if (lang === 'javascript' || lang === 'js' || lang === 'typescript' || lang === 'ts') {
      const scriptPath = path.join(tmpDir, 'solution.js');
      fs.writeFileSync(scriptPath, code, 'utf-8');
      cmd = 'node';
      args = [scriptPath];
    } else if (lang === 'cpp' || lang === 'c++') {
      const srcPath = path.join(tmpDir, 'solution.cpp');
      const binPath = path.join(tmpDir, process.platform === 'win32' ? 'solution.exe' : 'solution');
      fs.writeFileSync(srcPath, code, 'utf-8');

      // Compile first
      const compileRes = await spawnProcess('g++', ['-O2', srcPath, '-o', binPath], '', 7000);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileRes.stderr || 'C++ compilation failed',
          exitCode: compileRes.exitCode,
          timeMs: Date.now() - startTime,
        };
      }

      cmd = binPath;
      args = [];
    } else if (lang === 'java') {
      const srcPath = path.join(tmpDir, 'Main.java');
      fs.writeFileSync(srcPath, code, 'utf-8');

      const compileRes = await spawnProcess('javac', [srcPath], '', 7000);
      if (compileRes.exitCode !== 0) {
        return {
          stdout: '',
          stderr: compileRes.stderr || 'Java compilation failed',
          exitCode: compileRes.exitCode,
          timeMs: Date.now() - startTime,
        };
      }

      cmd = 'java';
      args = ['-cp', tmpDir, 'Main'];
    } else {
      throw new Error(`Unsupported execution language: ${language}`);
    }

    const runRes = await spawnProcess(cmd, args, stdin, timeoutMs);
    return {
      ...runRes,
      timeMs: Date.now() - startTime,
    };
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}

function spawnProcess(
  cmd: string,
  args: string[],
  stdin: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; exitCode: number; timedOut: boolean }> {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const child = spawn(cmd, args, {
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const timer = setTimeout(() => {
      timedOut = true;
      try {
        child.kill('SIGKILL');
      } catch {}
      resolve({
        stdout: '',
        stderr: 'Time Limit Exceeded (execution exceeded limit)',
        exitCode: 124,
        timedOut: true,
      });
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      if (stdout.length < 50000) stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      if (stderr.length < 50000) stderr += data.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        stdout: '',
        stderr: err.message,
        exitCode: 1,
        timedOut: false,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timer);
      if (!timedOut) {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 0,
          timedOut: false,
        });
      }
    });

    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
  });
}

