'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Award, CheckCircle2, Loader2, Sparkles, Volume2, Shield } from 'lucide-react';

interface InterviewWrappingUpSectionProps {
  candidateName: string;
  interviewerName: string;
  interviewerAvatar?: string;
  durationMs?: number;
  onComplete: () => void;
  speakFn?: (text: string) => Promise<void>;
}

export function InterviewWrappingUpSection({
  candidateName,
  interviewerName,
  interviewerAvatar = '/avatars/tanya.jpg',
  durationMs = 2800,
  onComplete,
  speakFn,
}: InterviewWrappingUpSectionProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const hasSpokenRef = React.useRef(false);

  const steps = [
    'Locking code & compiling test execution suite',
    `Synthesizing interview transcript with ${interviewerName}`,
    'Computing 6-axis skill matrix (Correctness, Approach, Explaining)',
    'Finalizing detailed performance score report',
  ];

  // Spoken voice wrap-up (guaranteed to fire only once, after active speech clears)
  useEffect(() => {
    if (hasSpokenRef.current) return;
    hasSpokenRef.current = true;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const timer = setTimeout(async () => {
      const wrapUpMsg = `Thank you for your time, ${candidateName}. Please go through your report, and do give us a review.`;
      if (speakFn) {
        try {
          await speakFn(wrapUpMsg);
        } catch {}
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [candidateName, speakFn]);

  // Animate progress over durationMs
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      if (pct < 30) setStepIndex(0);
      else if (pct < 60) setStepIndex(1);
      else if (pct < 85) setStepIndex(2);
      else setStepIndex(3);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 300);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div className="w-full max-w-xl mx-auto py-10 sm:py-16 px-4 animate-in fade-in-50 duration-300">
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-sm relative text-center">
        {/* Ambient glow */}
        <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-accent-subtle blur-3xl pointer-events-none" />

        {/* Central Interviewer Portrait with wrapping up badge */}
        <div className="relative w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/40 animate-[spin_6s_linear_infinite]" />
          <div className="absolute inset-3 rounded-full bg-accent-subtle animate-ping" />

          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-accent/60 shadow-sm">
            <Image
              src={interviewerAvatar}
              alt={interviewerName}
              fill
              className="object-cover"
            />
          </div>

          <div className="absolute -bottom-2 bg-surface border border-border text-accent text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm">
            {progress}%
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2">
          Wrapping up your interview
        </h2>
        <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto mb-7">
          {interviewerName} is computing your algorithmic scores and generating your detailed radar report...
        </p>

        {/* Progress bar */}
        <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden mb-7 border border-border">
          <div
            className="h-full bg-accent rounded-full transition-all duration-75 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checklist */}
        <div className="space-y-2.5 text-left mb-6">
          {steps.map((text, idx) => {
            const isPast = idx < stepIndex;
            const isCurrent = idx === stepIndex;

            return (
              <div
                key={idx}
                className={`flex items-center justify-between text-xs p-2.5 rounded-xl border transition-all ${isCurrent
                    ? 'border-amber-500/40 bg-amber-500/10 text-white font-medium'
                    : isPast
                      ? 'border-white/5 bg-white/[0.02] text-zinc-300'
                      : 'border-transparent text-zinc-600'
                  }`}
              >
                <span>{text}</span>
                {isPast ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin flex-shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-700 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Generating multi-dimensional radar report</span>
        </div>
      </div>
    </div>
  );
}

