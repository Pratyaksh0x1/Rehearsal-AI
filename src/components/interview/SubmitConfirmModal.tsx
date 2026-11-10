'use client';

import React from 'react';
import { Lock } from 'lucide-react';

interface SubmitConfirmModalProps {
  isOpen: boolean;
  onKeepCoding: () => void;
  onConfirmSubmit: () => void;
  passedTests?: number;
  totalTests?: number;
  isEvaluating?: boolean;
}

export function SubmitConfirmModal({
  isOpen,
  onKeepCoding,
  onConfirmSubmit,
  passedTests = 10,
  totalTests = 10,
  isEvaluating = false,
}: SubmitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-overlay backdrop-blur-sm animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-xl p-6 sm:p-8 text-center sm:text-left">
        {/* Lock Icon */}
        <div className="w-12 h-12 rounded-xl bg-accent-subtle border border-accent/20 flex items-center justify-center text-accent mb-5 shadow-sm">
          <Lock className="w-5 h-5 text-accent" />
        </div>

        {/* Modal Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-3">
          Submit and end the round?
        </h2>

        {/* Modal Body */}
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-normal mb-8">
          Your code is locked after this, and your interviewer gives you feedback next. Your last
          run passed <strong className="text-text-primary font-semibold">{passedTests} of {totalTests} tests</strong>.
        </p>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onKeepCoding}
            disabled={isEvaluating}
            className="px-5 py-2.5 rounded-lg bg-surface hover:bg-surface-hover text-text-muted hover:text-text-primary font-medium text-xs sm:text-sm border border-border transition-all cursor-pointer disabled:opacity-50 focus-ring"
          >
            Keep coding
          </button>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isEvaluating}
            className="px-6 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-xs sm:text-sm shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 focus-ring"
          >
            {isEvaluating ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-accent-foreground border-t-transparent animate-spin inline-block" />
                <span>Evaluating...</span>
              </>
            ) : (
              <span>Submit solution</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

