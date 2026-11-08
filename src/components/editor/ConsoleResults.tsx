'use client';

import React from 'react';
import { Terminal, CheckCircle2, XCircle, Clock, Cpu } from 'lucide-react';
import { ExecutionResult } from '@/lib/judge';

interface ConsoleResultsProps {
  result: ExecutionResult | null;
  isRunning?: boolean;
}

export function ConsoleResults({ result, isRunning = false }: ConsoleResultsProps) {
  return (
    <div className="w-full rounded-xl border border-border bg-surface overflow-hidden shadow-sm flex flex-col">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-bg-subtle border-b border-border text-xs font-semibold">
        <div className="flex items-center gap-2 text-text-primary">
          <Terminal className="w-3.5 h-3.5 text-accent" />
          <span>Execution Output & Test Results</span>
        </div>

        {result && (
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1 text-text-subtle">
              <Clock className="w-3 h-3" />
              {result.timeMs} ms
            </span>
            {result.memoryKb && (
              <span className="flex items-center gap-1 text-text-subtle">
                <Cpu className="w-3 h-3" />
                {(result.memoryKb / 1024).toFixed(1)} MB
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold ${
                result.status === 'Accepted'
                  ? 'bg-success-subtle text-success'
                  : 'bg-danger-subtle text-danger'
              }`}
            >
              {result.status === 'Accepted' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {result.status}
            </span>
          </div>
        )}
      </div>

      {/* Console Output Body */}
      <div className="p-4 bg-bg text-text-primary font-mono text-xs overflow-y-auto max-h-48 min-h-[90px] leading-relaxed">
        {isRunning ? (
          <div className="flex items-center gap-2 text-accent animate-pulse">
            <span className="inline-block w-2 h-2 rounded-full bg-accent" />
            Executing code in sandboxed judge environment...
          </div>
        ) : result ? (
          <div>
            {result.stdout && (
              <pre className="whitespace-pre-wrap text-text-primary mb-2 font-mono">
                {result.stdout}
              </pre>
            )}
            {result.stderr && (
              <pre className="whitespace-pre-wrap text-danger font-mono">
                {result.stderr}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-text-subtle italic">
            Click &quot;Run Code&quot; to test your solution against example test cases, or click &quot;Submit Interview&quot; for full AI evaluation.
          </p>
        )}
      </div>
    </div>
  );
}

