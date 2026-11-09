'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Cpu, ShieldCheck, CheckCircle2, Loader2, Sparkles, Terminal, Volume2 } from 'lucide-react';

interface EnvironmentSetupAnimationProps {
  interviewerName?: string;
  interviewerRole?: string;
  interviewerAvatar?: string;
  language?: string;
  company?: string;
  durationMs?: number;
  onComplete: () => void;
}

export function EnvironmentSetupAnimation({
  interviewerName = 'Arjun',
  interviewerRole = 'Software Developer',
  interviewerAvatar = '/avatars/arjun.jpg',
  language = 'C++',
  company = 'Any company',
  durationMs = 2600,
  onComplete,
}: EnvironmentSetupAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);

  const displayCompany = company && company !== 'Any company' ? company : 'Production';

  const steps = [
    {
      title: `Provisioning isolated ${language.toUpperCase()} container`,
      subtitle: 'Zero-latency runtime sandbox initialized',
      icon: Terminal,
    },
    {
      title: `Establishing secure voice channel with ${interviewerName}`,
      subtitle: `${interviewerRole} connected`,
      icon: Volume2,
    },
    {
      title: `Loading ${displayCompany} problem suite & test harness`,
      subtitle: '3 visible test cases + 2 hidden edge cases primed',
      icon: Cpu,
    },
    {
      title: 'Calibrating anti-cheat proctor & countdown timer',
      subtitle: 'Environment certified and ready',
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 35; // Update every 35ms for smooth 60fps counter

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const rawPct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(rawPct);

      // Advance checklist step based on progress
      if (rawPct < 28) {
        setCurrentStepIndex(0);
      } else if (rawPct < 56) {
        setCurrentStepIndex(1);
      } else if (rawPct < 84) {
        setCurrentStepIndex(2);
      } else {
        setCurrentStepIndex(3);
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 300); // 300ms fade-out transition
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div
      className={`w-full max-w-2xl mx-auto py-8 sm:py-12 px-4 transition-all duration-300 ${
        isFadingOut ? 'opacity-0 scale-98 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      <div className="rounded-3xl border border-border bg-surface p-6 sm:p-10 shadow-2xl relative backdrop-blur-2xl dark:bg-[#15101a]/95 dark:border-white/10 dark:shadow-[0_15px_60px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* Ambient background glow pulses */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none animate-pulse" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Central Rotating Rings & Glowing Core */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-6">
            {/* Outer Slow Rotating Dashed Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-amber-500/40 animate-[spin_8s_linear_infinite]" />

            {/* Inner Reverse Rotating Ring */}
            <div className="absolute inset-2 rounded-full border border-purple-500/30 animate-[spin_5s_linear_infinite_reverse]" />

            {/* Glowing Pulse Wave */}
            <div className="absolute inset-4 rounded-full bg-amber-500/15 animate-ping" />

            {/* Core Avatar or Tech Squircle */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-amber-500/60 shadow-[0_0_30px_rgba(245,158,11,0.35)] flex items-center justify-center bg-[#1e1518]">
              {interviewerAvatar ? (
                <Image
                  src={interviewerAvatar}
                  alt={interviewerName}
                  fill
                  className="object-cover scale-105"
                />
              ) : (
                <Terminal className="w-8 h-8 text-[#f59e0b]" />
              )}
            </div>

            {/* Percentage Badge */}
            <div className="absolute -bottom-2.5 bg-[#221619] border border-amber-500/50 text-[#f59e0b] text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full shadow-md">
              {progress}%
            </div>
          </div>

          {/* Heading */}
          <h2 className="font-serif text-2xl sm:text-3xl font-normal text-text-primary dark:text-white tracking-tight mb-2">
            Setting up your environment
          </h2>
          <p className="text-xs sm:text-sm text-text-muted dark:text-zinc-400 max-w-md mb-8">
            Connecting container runtime, anti-cheat proctor, and briefing with{' '}
            <span className="text-[#f59e0b] font-semibold">{interviewerName}</span>...
          </p>

          {/* Smooth Metallic Progress Bar */}
          <div className="w-full bg-slate-200 dark:bg-white/5 h-2 rounded-full overflow-hidden mb-8 border border-border dark:border-white/10 relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-[#f7cf7c] to-amber-500 rounded-full transition-all duration-75 shadow-[0_0_15px_rgba(247,207,124,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Phased Setup Checklist */}
          <div className="w-full space-y-3 text-left">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              const StepIcon = step.icon;

              return (
                <div
                  key={idx}
                  className={`rounded-2xl p-3 sm:p-3.5 border transition-all duration-200 flex items-center justify-between ${
                    isCurrent
                      ? 'border-amber-500/40 bg-amber-500/10 dark:bg-amber-500/[0.08] shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : isPast
                      ? 'border-border/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] opacity-80'
                      : 'border-transparent bg-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? 'bg-amber-500/20 text-[#f59e0b]'
                          : isPast
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-white/5 text-zinc-500'
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <h4
                        className={`text-xs sm:text-sm font-semibold leading-tight ${
                          isCurrent
                            ? 'text-text-primary dark:text-white'
                            : isPast
                            ? 'text-text-primary dark:text-zinc-300'
                            : 'text-text-muted dark:text-zinc-500'
                        }`}
                      >
                        {step.title}
                      </h4>
                      <p className="text-[11px] text-text-muted dark:text-zinc-400 mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-3">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Security Assurance */}
          <div className="mt-7 flex items-center gap-2 text-[11px] text-text-muted dark:text-zinc-500">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Isolated browser container · Encrypted audio stream</span>
          </div>
        </div>
      </div>
    </div>
  );
}
