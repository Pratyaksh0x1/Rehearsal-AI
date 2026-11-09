'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Play, RotateCcw, Loader2, Eye } from 'lucide-react';

// Dynamic import of Monaco Editor to avoid SSR hydration issues
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export const DEFAULT_STARTER_CODE: Record<string, string> = {
  python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        # Write your solution here
        pass
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solve(nums, target) {
    // Write your solution here
}
`,
  typescript: `function solve(nums: number[], target: number): number[] {
    // Write your solution here
}
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        // Write your solution here
    }
};
`,
  java: `class Solution {
    public int[] solve(int[] nums, int target) {
        // Write your solution here
        return new int[0];
    }
}
`,
};

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  onRunCode: () => void;
  isRunning?: boolean;
  interviewerName?: string;
  onSubmitSolution?: () => void;
}

export function CodeEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  onRunCode,
  isRunning = false,
  interviewerName = 'Tanya',
  onSubmitSolution,
}: CodeEditorProps) {
  const { theme } = useTheme();

  const handleReset = () => {
    const defaultTemplate = DEFAULT_STARTER_CODE[language] || DEFAULT_STARTER_CODE.python;
    onChange(defaultTemplate);
  };

  const monacoLanguage = language === 'cpp' ? 'cpp' : language;
  const displayLang =
    language === 'cpp'
      ? 'C++'
      : language === 'java'
      ? 'Java'
      : language === 'javascript'
      ? 'JavaScript'
      : 'Python';

  return (
    <div className="flex flex-col h-full border border-border dark:border-white/10 rounded-2xl overflow-hidden bg-surface dark:bg-[#15101a] shadow-sm">
      {/* Editor Toolbar matching media_1794199229585_34e388fa.jpg */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-subtle dark:bg-[#1a1424] border-b border-border dark:border-white/10">
        {/* Solution Tab + Language Badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-text-primary dark:text-white">
            Solution
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-[#f59e0b] border border-amber-500/30">
            {displayLang}
          </span>
        </div>

        {/* Right side: Interviewer watching notice + Reset */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
            <Eye className="w-3.5 h-3.5 text-zinc-500" />
            <span>{interviewerName} sees your code as you type</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover dark:hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 min-h-[380px] relative">
        <Monaco
          height="100%"
          language={monacoLanguage}
          value={code}
          onChange={(val) => onChange(val || '')}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            fontFamily: 'JetBrains Mono, Fira Code, monospace',
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            padding: { top: 14, bottom: 14 },
          }}
        />
      </div>

      {/* Bottom Action Controls matching media_1794199229585_34e388fa.jpg */}
      <div className="flex items-center justify-between px-4 py-3 bg-bg-subtle dark:bg-[#1a1424] border-t border-border dark:border-white/10">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRunCode}
            disabled={isRunning}
            className="px-5 py-2 text-xs font-semibold rounded-full bg-white/5 hover:bg-white/10 text-zinc-200 border border-white/10 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f59e0b]" />
                <span>Running tests...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-emerald-400" />
                <span>Run test cases</span>
              </>
            )}
          </button>
        </div>

        {onSubmitSolution && (
          <button
            type="button"
            onClick={onSubmitSolution}
            className="px-6 py-2 rounded-full font-bold text-slate-950 text-xs sm:text-sm bg-gradient-to-r from-[#d8973c] via-[#f7cf7c] to-[#d8973c] hover:brightness-105 shadow-[0_0_15px_rgba(247,214,136,0.3)] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Submit solution</span>
          </button>
        )}
      </div>
    </div>
  );
}
