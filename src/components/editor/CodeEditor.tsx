'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Play, RotateCcw, Check, Loader2 } from 'lucide-react';

// Dynamic import of Monaco Editor to avoid SSR hydration issues
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export const DEFAULT_STARTER_CODE: Record<string, string> = {
  python: `class Solution:
    def solve(self, nums: list[int], target: int) -> list[int]:
        pass
`,
  javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function solve(nums, target) {
    
}
`,
  typescript: `function solve(nums: number[], target: number): number[] {
    
}
`,
  cpp: `#include <vector>
using namespace std;

class Solution {
public:
    vector<int> solve(vector<int>& nums, int target) {
        
    }
};
`,
  java: `class Solution {
    public int[] solve(int[] nums, int target) {
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
}

export function CodeEditor({
  code,
  onChange,
  language,
  onLanguageChange,
  onRunCode,
  isRunning = false,
}: CodeEditorProps) {
  const { theme } = useTheme();

  const handleReset = () => {
    const defaultTemplate = DEFAULT_STARTER_CODE[language] || DEFAULT_STARTER_CODE.python;
    onChange(defaultTemplate);
  };

  const monacoLanguage = language === 'cpp' ? 'cpp' : language;

  return (
    <div className="flex flex-col h-full border border-border rounded-xl overflow-hidden bg-surface shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-bg-subtle border-b border-border">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="editor-lang" className="text-xs font-semibold text-text-muted">
            Language:
          </label>
          <select
            id="editor-lang"
            value={language}
            onChange={(e) => {
              const newLang = e.target.value;
              onLanguageChange(newLang);
              onChange(DEFAULT_STARTER_CODE[newLang] || '');
            }}
            className="text-xs font-mono font-medium px-2.5 py-1 rounded-md bg-surface border border-border text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="typescript">TypeScript</option>
            <option value="cpp">C++ 17</option>
            <option value="java">Java 15</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-2.5 py-1 text-xs font-medium rounded-md border border-border bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            type="button"
            onClick={onRunCode}
            disabled={isRunning}
            className="px-3.5 py-1 text-xs font-bold rounded-md bg-success hover:bg-success/90 text-success-foreground transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 min-h-[360px] relative">
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
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}

