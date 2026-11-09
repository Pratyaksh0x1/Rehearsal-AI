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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50 duration-200">
      <div className="relative w-full max-w-md bg-[#161220] border border-white/10 rounded-3xl shadow-2xl p-6 sm:p-8 text-center sm:text-left">
        {/* Lock Icon matching media_1794199328633_8dccddd2.png */}
        <div className="w-12 h-12 rounded-2xl bg-[#2b1f1a] border border-[#f59e0b]/40 flex items-center justify-center text-[#f59e0b] mb-5 shadow-sm">
          <Lock className="w-5 h-5 text-[#f59e0b]" />
        </div>

        {/* Modal Title */}
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white tracking-tight mb-3">
          Submit and end the round?
        </h2>

        {/* Modal Body */}
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal mb-8">
          Your code is locked after this, and your interviewer gives you feedback next. Your last
          run passed <strong className="text-zinc-200 font-semibold">{passedTests} of {totalTests} tests</strong>.
        </p>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-end gap-3.5">
          <button
            type="button"
            onClick={onKeepCoding}
            disabled={isEvaluating}
            className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 font-semibold text-xs sm:text-sm border border-white/10 transition-all cursor-pointer disabled:opacity-50"
          >
            Keep coding
          </button>

          <button
            type="button"
            onClick={onConfirmSubmit}
            disabled={isEvaluating}
            className="px-7 py-3 rounded-full bg-gradient-to-r from-[#d8973c] via-[#f7d688] to-[#d8973c] hover:brightness-105 text-slate-950 font-bold text-xs sm:text-sm shadow-[0_0_20px_rgba(247,214,136,0.3)] transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            {isEvaluating ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin inline-block" />
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
