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
      <div className="rounded-2xl border border-border bg-surface p-6 sm:p-10 shadow-sm relative overflow-hidden">
        {/* Ambient subtle accent glow */}
        <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-accent-subtle blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Central Rotating Rings & Glowing Core */}
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center mb-6">
            {/* Outer Slow Rotating Dashed Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-accent/40 animate-[spin_8s_linear_infinite]" />

            {/* Inner Reverse Rotating Ring */}
            <div className="absolute inset-2 rounded-full border border-border-strong animate-[spin_5s_linear_infinite_reverse]" />

            {/* Glowing Pulse Wave */}
            <div className="absolute inset-4 rounded-full bg-accent-subtle animate-ping" />

            {/* Core Avatar or Tech Squircle */}
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden ring-2 ring-accent/60 shadow-sm flex items-center justify-center bg-surface">
              {interviewerAvatar ? (
                <Image
                  src={interviewerAvatar}
                  alt={interviewerName}
                  fill
                  className="object-cover scale-105"
                />
              ) : (
                <Terminal className="w-8 h-8 text-accent" />
              )}
            </div>

            {/* Percentage Badge */}
            <div className="absolute -bottom-2.5 bg-surface border border-border text-accent text-xs font-mono font-bold px-2.5 py-0.5 rounded-full shadow-sm">
              {progress}%
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight mb-2">
            Setting up your environment
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mb-8">
            Connecting container runtime, anti-cheat proctor, and briefing with{' '}
            <span className="text-accent font-semibold">{interviewerName}</span>...
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden mb-8 border border-border relative">
            <div
              className="h-full bg-accent rounded-full transition-all duration-75 shadow-sm"
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
                  className={`rounded-xl p-3 sm:p-3.5 border transition-all duration-200 flex items-center justify-between ${
                    isCurrent
                      ? 'border-accent bg-accent-subtle'
                      : isPast
                      ? 'border-border bg-bg-subtle opacity-90'
                      : 'border-transparent bg-transparent opacity-40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCurrent
                          ? 'bg-accent text-accent-foreground'
                          : isPast
                          ? 'bg-success-subtle text-success'
                          : 'bg-surface-hover text-text-subtle'
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>

                    <div>
                      <h4
                        className={`text-xs sm:text-sm font-semibold leading-tight ${
                          isCurrent
                            ? 'text-text-primary'
                            : isPast
                            ? 'text-text-muted'
                            : 'text-text-subtle'
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

