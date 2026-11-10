'use client';

import React, { useRef, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Play, RotateCcw, Loader2, Eye } from 'lucide-react';

// Dynamic import of Monaco Editor to avoid SSR hydration issues
const Monaco = dynamic(() => import('@monaco-editor/react'), { ssr: false });

export const DEFAULT_STARTER_CODE: Record<string, string> = {
  python: `class Solution:
    def solve(self):
        # Write your solution here
        pass
`,
  javascript: `function solve() {
    // Write your solution here
}
`,
  typescript: `function solve(): void {
    // Write your solution here
}
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

class Solution {
public:
    void solve() {
        // Write your solution here
    }
};
`,
  java: `class Solution {
    public void solve() {
        // Write your solution here
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
  onPasteBlocked?: () => void;
  blockExternalPaste?: boolean;
  starterCode?: Record<string, string>;
  onResetCode?: () => void;
}

function defineThemes(monaco: any) {
  try {
    monaco.editor.defineTheme('rehearsal-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: '', foreground: '0f172a' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '2563eb', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
        { token: 'type', foreground: '7c3aed' },
        { token: 'identifier', foreground: '0f172a' },
        { token: 'delimiter', foreground: '334155' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#0f172a',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorCursor.foreground': '#2563eb',
        'editor.selectionBackground': '#bfdbfe',
        'editor.inactiveSelectionBackground': '#e2e8f0',
        'editorGutter.background': '#ffffff',
        'editorWidget.background': '#ffffff',
        'editorWidget.border': '#e2e8f0',
      },
    });

    monaco.editor.defineTheme('rehearsal-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'f8fafc' },
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '60a5fa', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'type', foreground: 'c084fc' },
        { token: 'identifier', foreground: 'f8fafc' },
        { token: 'delimiter', foreground: 'cbd5e1' },
      ],
      colors: {
        'editor.background': '#0b0f19',
        'editor.foreground': '#f8fafc',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#cbd5e1',
        'editor.lineHighlightBackground': '#161e31',
        'editorCursor.foreground': '#3b82f6',
        'editor.selectionBackground': '#1e3a8a',
        'editor.inactiveSelectionBackground': '#172554',
        'editorGutter.background': '#0b0f19',
        'editorWidget.background': '#161e31',
        'editorWidget.border': '#23304c',
      },
    });
  } catch (err) {
    console.warn('Failed to define Monaco themes:', err);
  }
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
  onPasteBlocked,
  blockExternalPaste = true,
  starterCode,
  onResetCode,
}: CodeEditorProps) {
  const { theme } = useTheme();
  const monacoRef = useRef<any>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [hasMonacoFailed, setHasMonacoFailed] = useState(false);

  const activeMonacoTheme = theme === 'dark' ? 'vs-dark' : 'vs';

  useEffect(() => {
    if (monacoRef.current?.editor) {
      try {
        monacoRef.current.editor.setTheme(activeMonacoTheme);
      } catch (err) {
        console.warn('Monaco setTheme error:', err);
      }
    }
  }, [activeMonacoTheme]);

  // Timeout guard: if Monaco doesn't load within 5s (e.g. offline/CDN blocked), fallback to standard code textarea
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!editorReady) {
        setHasMonacoFailed(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [editorReady]);

  const handleReset = () => {
    if (onResetCode) {
      onResetCode();
      return;
    }
    const defaultTemplate =
      starterCode?.[language] ||
      (DEFAULT_STARTER_CODE as any)[language] ||
      DEFAULT_STARTER_CODE.python;
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
    <div
      className="flex flex-col h-full w-full border border-border rounded-xl overflow-hidden bg-surface shadow-sm"
      onPasteCapture={(e) => {
        if (blockExternalPaste) {
          e.preventDefault();
          e.stopPropagation();
          onPasteBlocked?.();
        }
      }}
    >
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface border-b border-border shrink-0">
        {/* Solution Tab + Language Badge */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-semibold text-text-primary">
            Solution
          </span>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-accent-subtle text-accent border border-accent/20">
            {displayLang}
          </span>
        </div>

        {/* Right side: Interviewer watching notice + Reset */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-muted">
            <Eye className="w-3.5 h-3.5 text-text-subtle" />
            <span>{interviewerName} sees your code as you type</span>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors cursor-pointer focus-ring"
            title="Reset to starter template"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Monaco Code Editor Area */}
      <div className="flex-1 min-h-[220px] relative bg-surface w-full overflow-hidden">
        {hasMonacoFailed ? (
          <div className="h-full w-full flex flex-col">
            <textarea
              value={code}
              onChange={(e) => onChange(e.target.value)}
              disabled={isRunning}
              className="flex-1 w-full h-full p-4 font-mono text-xs sm:text-sm bg-surface text-text-primary border-none outline-none resize-none leading-relaxed selection:bg-accent-subtle selection:text-accent"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>
        ) : (
          <Monaco
            height="100%"
            width="100%"
            language={monacoLanguage}
            value={code}
            onChange={(val) => onChange(val || '')}
            theme={activeMonacoTheme}
            beforeMount={(monaco) => {
              monacoRef.current = monaco;
            }}
            onMount={(editor, monaco) => {
              monacoRef.current = monaco;
              setEditorReady(true);
              try {
                monaco.editor.setTheme(activeMonacoTheme);
              } catch {}

              if (blockExternalPaste) {
                editor.onKeyDown((e) => {
                  if (
                    (e.ctrlKey || e.metaKey) &&
                    (e.code === 'KeyV' || e.keyCode === monaco.KeyCode.KeyV)
                  ) {
                    e.preventDefault();
                    e.stopPropagation();
                    onPasteBlocked?.();
                  }
                });
              }
            }}
            loading={
              <div className="flex flex-col items-center justify-center h-full w-full text-xs text-text-muted bg-surface gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
                <span className="font-mono text-text-primary">Loading code editor...</span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: 'JetBrains Mono, Fira Code, monospace',
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 4,
              wordWrap: 'on',
              readOnly: isRunning,
              padding: { top: 14, bottom: 14 },
            }}
          />
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface border-t border-border shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRunCode}
            disabled={isRunning}
            title="Run test cases (Ctrl + Enter)"
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-surface-hover hover:bg-surface-active text-text-primary border border-border transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 focus-ring"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Running tests...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current text-success" />
                <span>Run test cases</span>
                <kbd className="hidden sm:inline-block text-[10px] font-mono text-text-subtle px-1 py-0.2 rounded bg-bg border border-border ml-1">
                  Ctrl+↵
                </kbd>
              </>
            )}
          </button>
        </div>

        {onSubmitSolution && (
          <button
            type="button"
            onClick={onSubmitSolution}
            title="Submit solution (Ctrl + Shift + Enter)"
            className="px-4 py-1.5 rounded-lg font-semibold text-accent-foreground text-xs sm:text-sm bg-accent hover:bg-accent-hover shadow-sm transition-all cursor-pointer flex items-center gap-1.5 focus-ring"
          >
            <span>Submit solution</span>
            <kbd className="hidden sm:inline-block text-[10px] font-mono text-accent-foreground/75 px-1 py-0.2 rounded bg-black/20 ml-1">
              Ctrl+⇧+↵
            </kbd>
          </button>
        )}
      </div>
    </div>
  );
}
