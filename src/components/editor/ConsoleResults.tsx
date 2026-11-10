'use client';

import React, { useState, useMemo } from 'react';
import { Terminal, Check, X, AlertTriangle, FileCode } from 'lucide-react';
import { ExecutionResult } from '@/lib/judge';

interface TestCaseItem {
  input: string;
  expected_output: string;
  is_hidden?: boolean;
}

interface ConsoleResultsProps {
  result: ExecutionResult | null;
  isRunning?: boolean;
  problem?: {
    title?: string;
    test_cases?: TestCaseItem[];
    examples?: Array<{ input: string; output: string; explanation?: string }>;
    starter_code?: { python?: string; javascript?: string; cpp?: string; java?: string };
  } | null;
  language?: string;
}

/**
 * Splits comma-separated arguments that may contain nested quotes, brackets, or braces.
 */
function splitInputArguments(inputStr: string): string[] {
  if (!inputStr) return [];
  const parts: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';
  let bracketDepth = 0;

  for (let i = 0; i < inputStr.length; i++) {
    const c = inputStr[i];
    if (inQuote) {
      current += c;
      if (c === quoteChar && inputStr[i - 1] !== '\\') inQuote = false;
    } else if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
      current += c;
    } else if (c === '[' || c === '{' || c === '(') {
      bracketDepth++;
      current += c;
    } else if (c === ']' || c === '}' || c === ')') {
      bracketDepth--;
      current += c;
    } else if ((c === ',' || c === '\n') && bracketDepth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Extracts formal parameter names from starter code or examples.
 */
function extractParamNames(problem?: ConsoleResultsProps['problem']): string[] {
  if (!problem) return [];

  // 1. Check Python starter code signature: def method(self, arg1: type, arg2: type)
  if (problem.starter_code?.python) {
    const m = problem.starter_code.python.match(/def\s+\w+\s*\(\s*self\s*,\s*([^)]+)\)/);
    if (m && m[1]) {
      const names = m[1]
        .split(',')
        .map((p) => p.split(':')[0].trim())
        .filter(Boolean);
      if (names.length > 0) return names;
    }
  }

  // 2. Check JavaScript starter code signature: function method(arg1, arg2)
  if (problem.starter_code?.javascript) {
    const m = problem.starter_code.javascript.match(/function\s+\w+\s*\(([^)]+)\)/);
    if (m && m[1]) {
      const names = m[1].split(',').map((p) => p.trim()).filter(Boolean);
      if (names.length > 0) return names;
    }
  }

  // 3. Check C++ starter code signature: return_type method(type1 arg1, type2 arg2)
  if (problem.starter_code?.cpp) {
    const m = problem.starter_code.cpp.match(/\w+\s*\(([^)]+)\)\s*\{/);
    if (m && m[1]) {
      const names = m[1]
        .split(',')
        .map((p) => {
          const parts = p.trim().split(/\s+/);
          return parts[parts.length - 1].replace(/[&*]/g, '');
        })
        .filter(Boolean);
      if (names.length > 0) return names;
    }
  }

  // 4. Check example input strings e.g. "s = ..., t = ..."
  if (problem.examples?.[0]?.input) {
    const regex = /([a-zA-Z_]\w*)\s*=/g;
    const names: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(problem.examples[0].input)) !== null) {
      names.push(match[1]);
    }
    if (names.length > 0) {
      return names;
    }
  }

  return [];
}

/**
 * Parses raw input string into an array of { name, value } pairs matching LeetCode format.
 */
function parseInputPairs(rawInput: string, paramNames: string[] = []): Array<{ name: string; value: string }> {
  const parts = splitInputArguments(rawInput);
  return parts.map((part, idx) => {
    // If part already has 'param = val'
    const eqIdx = part.indexOf('=');
    if (eqIdx > 0 && eqIdx < 20 && !part.slice(0, eqIdx).includes('"') && !part.slice(0, eqIdx).includes('[')) {
      return {
        name: part.slice(0, eqIdx).trim(),
        value: part.slice(eqIdx + 1).trim(),
      };
    }
    const name = paramNames[idx] || (paramNames.length === 1 ? paramNames[0] : `param${idx + 1}`);
    return { name, value: part };
  });
}

export function ConsoleResults({
  result,
  isRunning = false,
  problem,
}: ConsoleResultsProps) {
  const [selectedCaseIndex, setSelectedCaseIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'cases' | 'logs'>('cases');

  // Infer parameter names for this problem
  const paramNames = useMemo(() => extractParamNames(problem), [problem]);

  // Determine test cases to display (visible cases only)
  const visibleCases: Array<{
    caseNumber: number;
    input: string;
    expectedOutput: string;
    actualOutput?: string;
    passed?: boolean;
    error?: string;
    timeMs?: number;
  }> = useMemo(() => {
    if (result?.test_results && result.test_results.length > 0) {
      return result.test_results
        .filter((t) => !t.is_hidden)
        .map((t, idx) => ({
          caseNumber: idx + 1,
          input: t.input,
          expectedOutput: t.expectedOutput,
          actualOutput: t.actualOutput,
          passed: t.passed,
          error: t.error,
          timeMs: t.timeMs,
        }));
    }

    // Fallback to problem test cases before running
    const baseCases = problem?.test_cases?.filter((t) => !t.is_hidden) || [];
    if (baseCases.length > 0) {
      return baseCases.map((t, idx) => ({
        caseNumber: idx + 1,
        input: t.input,
        expectedOutput: t.expected_output,
      }));
    }

    // Fallback to problem examples
    if (problem?.examples && problem.examples.length > 0) {
      return problem.examples.map((ex, idx) => ({
        caseNumber: idx + 1,
        input: ex.input,
        expectedOutput: ex.output,
      }));
    }

    return [];
  }, [result, problem]);

  const activeCase = visibleCases[selectedCaseIndex] || visibleCases[0];
  const hasConsoleOutput = Boolean(result?.stdout || result?.stderr);
  const isCompilationError = result?.status === 'Compilation Error';

  return (
    <div className="w-full rounded-xl border border-border bg-surface text-text-primary overflow-hidden shadow-sm flex flex-col font-sans">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-surface">
        <div className="flex items-center gap-3">
          {isRunning ? (
            <div className="flex items-center gap-2.5 text-accent font-semibold text-sm">
              <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping" />
              <span>Running test cases in sandbox...</span>
            </div>
          ) : result ? (
            <div className="flex items-baseline gap-3">
              <span
                className={`text-xl font-bold tracking-tight ${
                  result.status === 'Accepted'
                    ? 'text-emerald-500 dark:text-emerald-400'
                    : 'text-rose-500 dark:text-rose-400'
                }`}
              >
                {result.status}
              </span>
              <span className="text-sm font-normal text-text-muted">
                Runtime: {result.timeMs ?? 0} ms
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm font-semibold text-text-muted">
              <Terminal className="w-4 h-4 text-accent" />
              <span>Test Cases</span>
            </div>
          )}
        </div>

        {/* Tab Switcher: Test Cases vs Logs */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('cases')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cases'
                ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Test Cases
          </button>

          {hasConsoleOutput && (
            <button
              type="button"
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'logs'
                  ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Console Logs</span>
              {result?.stderr && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-4 sm:p-5">
        {/* VIEW 1: Test Cases LeetCode Style */}
        {activeTab === 'cases' && !isCompilationError && (
          <div className="space-y-4">
            {/* Case Selection Tabs matching screenshot */}
            <div className="flex flex-wrap items-center gap-2">
              {visibleCases.map((c, idx) => {
                const isSelected = idx === selectedCaseIndex;
                const hasRun = c.passed !== undefined;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedCaseIndex(idx)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer focus-ring ${
                      isSelected
                        ? 'bg-surface-active text-text-primary border border-border shadow-sm'
                        : 'bg-surface-hover/60 text-text-muted hover:text-text-primary hover:bg-surface-hover border border-transparent'
                    }`}
                  >
                    {hasRun && (
                      <span
                        className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] font-bold ${
                          c.passed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {c.passed ? (
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        ) : (
                          <X className="w-2.5 h-2.5 stroke-[3]" />
                        )}
                      </span>
                    )}
                    <span>Case {c.caseNumber}</span>
                  </button>
                );
              })}
            </div>

            {/* Selected Case Details */}
            {activeCase ? (
              <div className="space-y-4 pt-1 animate-in fade-in-50 duration-150">
                {/* 1. INPUT SECTION */}
                <div>
                  <h4 className="text-xs font-semibold text-text-muted mb-2">Input</h4>
                  <div className="space-y-2.5">
                    {parseInputPairs(activeCase.input, paramNames).map((param, pIdx) => (
                      <div key={pIdx} className="space-y-1">
                        <span className="text-xs font-mono text-text-subtle block">
                          {param.name} =
                        </span>
                        <div className="bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-xs sm:text-sm text-text-primary font-medium select-text">
                          {param.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. OUTPUT SECTION (Only after code run) */}
                {activeCase.actualOutput !== undefined && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-muted mb-1.5">Output</h4>
                    <div
                      className={`border rounded-lg px-4 py-2.5 font-mono text-xs sm:text-sm font-medium select-text ${
                        activeCase.passed
                          ? 'bg-bg border-border text-text-primary'
                          : 'bg-danger-subtle/30 border-danger/40 text-danger'
                      }`}
                    >
                      {activeCase.actualOutput || (activeCase.error ? activeCase.error : '<empty>')}
                    </div>
                  </div>
                )}

                {/* 3. EXPECTED SECTION */}
                <div>
                  <h4 className="text-xs font-semibold text-text-muted mb-1.5">Expected</h4>
                  <div className="bg-bg border border-border rounded-lg px-4 py-2.5 font-mono text-xs sm:text-sm text-text-primary font-medium select-text">
                    {activeCase.expectedOutput}
                  </div>
                </div>

                {/* If code has not been run yet */}
                {!result && (
                  <p className="text-[11px] text-zinc-500 italic pt-1">
                    Click &ldquo;Run test cases&rdquo; to test your solution against these inputs and see real execution outputs.
                  </p>
                )}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-zinc-400">
                No test cases available for this problem.
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: Compilation Error View */}
        {isCompilationError && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Compilation or Syntax Error</span>
            </div>
            <pre className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap leading-relaxed">
              {result.stderr || result.stdout || 'Compilation failed.'}
            </pre>
          </div>
        )}

        {/* VIEW 3: Raw Logs View */}
        {activeTab === 'logs' && !isCompilationError && (
          <div className="space-y-3 font-mono text-xs">
            {result?.stdout && (
              <div>
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
                  Stdout:
                </span>
                <pre className="p-3 rounded-xl bg-black/40 border border-white/5 text-zinc-200 overflow-x-auto whitespace-pre-wrap">
                  {result.stdout}
                </pre>
              </div>
            )}
            {result?.stderr && (
              <div>
                <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block mb-1">
                  Stderr / Error Logs:
                </span>
                <pre className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 text-rose-300 overflow-x-auto whitespace-pre-wrap">
                  {result.stderr}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
