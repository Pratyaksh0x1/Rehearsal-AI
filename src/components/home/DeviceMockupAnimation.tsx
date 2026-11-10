'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Mic,
  Video,
  Camera,
  Trophy,
  Sparkles,
  Volume2,
  Terminal,
  Zap,
  Activity,
  Shield,
} from 'lucide-react';

const CODE_LINES = [
  'def two_sum(nums: list[int], target: int) -> list[int]:',
  '    seen = {}',
  '    for i, num in enumerate(nums):',
  '        diff = target - num',
  '        if diff in seen:',
  '            return [seen[diff], i]',
  '        seen[num] = i',
  '    return []',
];

const CODE_TEXT = CODE_LINES.join('\n');
const CODE_START_MS = 3000;
const TEST_START_MS = 8200;
const REPORT_START_MS = 11600;
const CYCLE_DURATION_MS = 16000;

export function DeviceMockupAnimation() {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [testsPassed, setTestsPassed] = useState<number>(0);
  const showPromo = stage === 4;

  useEffect(() => {
    const startedAt = Date.now();
    const updateAnimation = () => {
      const elapsed = (Date.now() - startedAt) % CYCLE_DURATION_MS;
      setElapsedMs(elapsed);

      if (elapsed < CODE_START_MS) {
        setStage(1);
        setTestsPassed(0);
      } else if (elapsed < TEST_START_MS) {
        setStage(2);
        setTestsPassed(0);
      } else if (elapsed < REPORT_START_MS) {
        setStage(3);
        setTestsPassed(Math.min(5, Math.floor((elapsed - TEST_START_MS) / 400) + 1));
      } else {
        setStage(4);
        setTestsPassed(5);
      }
    };

    updateAnimation();
    const timer = window.setInterval(updateAnimation, 120);
    return () => window.clearInterval(timer);
  }, []);

  const visibleCodeLength =
    stage === 1
      ? 0
      : stage === 2
        ? Math.floor(((elapsedMs - CODE_START_MS) / (TEST_START_MS - CODE_START_MS)) * CODE_TEXT.length)
        : CODE_TEXT.length;
  const typedLines = visibleCodeLength > 0 ? CODE_TEXT.slice(0, visibleCodeLength).split('\n') : [];
  const isTyping = stage === 2 && visibleCodeLength < CODE_TEXT.length;

  return (
    <div className="relative w-full max-w-6xl mx-auto py-8 px-2 sm:px-4">
      {/* Background Floating Luxury Glow Orbs (Moving at different speeds) */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 -right-16 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-float-medium" />
      <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float-fast" />

      {/* Floating Pill Badge 1 (Slow float) */}
      <div className="hidden lg:flex items-center gap-2.5 absolute -top-4 -left-6 z-20 px-3.5 py-1.5 rounded-full glass-pill animate-float-slow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-medium text-emerald-300">
          Gnani.ai &bull; AI Voice Interview
        </span>
      </div>

      {/* Floating Pill Badge 3 (Medium float) */}
      <div className="hidden lg:flex items-center gap-2 absolute -bottom-6 left-12 z-20 px-3.5 py-1.5 rounded-full glass-pill animate-float-slow">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-medium text-amber-200">
          Dual Leagues (Technical &amp; HR)
        </span>
      </div>

      {/* MAIN IMAC / MACBOOK PRO DISPLAY FRAME */}
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-border/40 via-border/10 to-transparent shadow-xl backdrop-blur-xl">
        <div className="rounded-xl overflow-hidden bg-bg border border-border">
          {/* macOS Title Bar */}
          <div className="h-10 bg-surface border-b border-border px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Standard OS window control buttons */}
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
              <span className="ml-3 text-xs font-mono text-text-muted flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-accent" />
                rehearsal-ai &mdash; technical-session.py
              </span>
            </div>

            {/* Session Status Pill */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success-subtle border border-success/30 text-[11px] font-mono text-success">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping" />
                STAGE {stage}/4: {stage === 1 ? 'AI SPEAKING' : stage === 2 ? 'CODING' : stage === 3 ? 'TESTING' : 'EVALUATION'}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-subtle font-mono">
                <Video className="w-3 h-3 text-success" />
                <Mic className="w-3 h-3 text-success" />
              </div>
            </div>
          </div>

          {/* INNER INTERACTIVE SCREEN CONTENT */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px] sm:min-h-[540px] bg-bg">
            {/* Left 5 Cols: Interviewer Panel & Spoken Audio Waveform */}
            <div className="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-border flex flex-col justify-between bg-bg-subtle">
              {/* Agent Profile & Live Status */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden ring-2 ring-accent/60 shadow-lg">
                    <Image
                      src="/avatars/kaveri.jpg"
                      alt="Kaveri - Lead Algorithms Specialist"
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-surface" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-text-primary">Kaveri</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent font-mono">Gnani.ai</span>
                    </div>
                    <p className="text-xs text-text-muted">Lead Algorithms Specialist &bull; Technical</p>
                  </div>
                </div>

                {/* Question Prompt Box */}
                <div className="rounded-xl p-3.5 bg-surface border border-border shadow-inner">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono text-accent uppercase tracking-wider font-semibold">
                      Problem #1 &bull; Medium
                    </span>
                    <span className="text-[11px] text-amber-400 font-mono">Rank: Gold IV</span>
                  </div>
                  <h4 className="text-sm font-semibold text-text-primary mb-1">Two Sum &bull; Pair with Target</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Given an integer array <code className="text-accent bg-accent/10 px-1 rounded">nums</code> and integer <code className="text-accent bg-accent/10 px-1 rounded">target</code>, return indices of two numbers that sum to target.
                  </p>
                </div>

                {/* Spoken Turn Dialog / Waveform Indicator */}
                <div className="mt-4 p-3 rounded-xl bg-surface border border-border">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-accent">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{stage === 1 ? 'Interviewer Speaking' : 'Candidate Audio Monitored'}</span>
                  </div>

                  {/* Pulsing Voice Waves */}
                  <div className="flex items-center justify-center gap-1 h-8">
                    {[16, 28, 42, 60, 34, 48, 70, 24, 52, 38, 64, 30, 20].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          stage === 1 ? 'bg-accent animate-pulse' : 'bg-success/50'
                        }`}
                        style={{
                          height: stage === 1 ? `${(h * 0.4) + ((i % 4) * 4)}px` : `${Math.max(6, (h * 0.15))}px`,
                          animationDelay: `${i * 70}ms`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Candidate Camera Preview & Proctor Status */}
              <div className="mt-4 pt-3 border-t border-border flex flex-wrap items-center gap-3 text-xs text-text-muted">
                <div className="relative w-24 sm:w-28 aspect-video shrink-0 overflow-hidden rounded-lg border border-border bg-black">
                  <Image
                    src="/avatars/arjun.jpg"
                    alt="Candidate camera preview"
                    fill
                    sizes="(max-width: 640px) 96px, 112px"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-black/70 px-1.5 py-1 text-[8px] font-mono text-white">
                    <Camera className="h-2.5 w-2.5 text-success" />
                    CAMERA PREVIEW
                  </div>
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-surface border border-border flex items-center justify-center">
                    <Activity className="w-4 h-4 text-success animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-medium text-text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" />
                      Proctoring Active
                    </div>
                    <div className="text-[10px] text-text-subtle">Screen &amp; Audio Synced</div>
                  </div>
                </div>
                <div className="ml-auto whitespace-nowrap text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                  20:00 ROUND
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Interactive IDE, Test Cases, & Rank Promotion Modal */}
            <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between bg-surface relative">
              {/* Code Editor Header */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-border text-xs font-mono text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-success">●</span>
                    <span className="text-text-primary font-medium">solution.py</span>
                    <span className="text-text-subtle">&bull; Python 3.11</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-muted border border-border">UTF-8</span>
                    <span className="text-xs bg-bg px-2 py-0.5 rounded text-text-muted border border-border">Spaces: 4</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mb-3 text-[10px] font-mono text-text-muted">
                  <Shield className="w-3 h-3 text-accent" />
                  <span>5 Test Cases</span>
                  <span className="text-text-subtle">(3 Visible + 2 Hidden)</span>
                </div>

                {/* Animated Code Typing Area */}
                <div className="font-mono text-[11px] sm:text-xs text-text-muted leading-relaxed bg-bg p-3.5 rounded-xl border border-border shadow-inner min-h-[190px]">
                  {stage === 1 && (
                    <div className="text-text-subtle italic">
                      # Your interviewer is introducing the problem...<br />
                      # Your coding workspace will unlock shortly.
                    </div>
                  )}

                  {typedLines.slice(0, -1).map((line, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-6 flex-shrink-0 text-text-subtle select-none text-right pr-3">{idx + 1}</span>
                      <span className={
                        line.startsWith('def')
                          ? 'text-accent font-semibold'
                          : line.includes('return')
                          ? 'text-purple-500 dark:text-purple-300 font-medium'
                          : line.includes('for ')
                          ? 'text-warning'
                          : 'text-text-primary'
                      }>
                        {line || '\u00a0'}
                      </span>
                    </div>
                  ))}

                  {typedLines.length > 0 && (
                    <div className="flex items-center mt-1">
                      <span className="w-6 flex-shrink-0 text-text-subtle select-none text-right pr-3">{typedLines.length}</span>
                      <span className={
                        typedLines[typedLines.length - 1].startsWith('def')
                          ? 'text-accent font-semibold'
                          : typedLines[typedLines.length - 1].includes('return')
                            ? 'text-purple-500 dark:text-purple-300 font-medium'
                            : typedLines[typedLines.length - 1].includes('for ')
                              ? 'text-warning'
                              : 'text-text-primary'
                      }>
                        {typedLines[typedLines.length - 1] || '\u00a0'}
                        {isTyping && <span className="ml-0.5 w-2 h-4 bg-accent animate-pulse inline-block align-middle" />}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test Runner Suite Bar */}
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Execution Engine</span>
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">
                      5 Total Cases
                    </span>
                  </div>

                  {/* 5 Test Case Badges (3 visible, 2 hidden) */}
                  <div className="grid grid-cols-5 gap-1 border-t border-border pt-3">
                    {[
                      { label: 'Case 1', hidden: false },
                      { label: 'Case 2', hidden: false },
                      { label: 'Case 3', hidden: false },
                      { label: 'Hidden 4', hidden: true },
                      { label: 'Hidden 5', hidden: true },
                    ].map((tc, idx) => {
                      const isPassed = stage >= 3 && testsPassed > idx;
                      return (
                        <div
                          key={idx}
                          className={`px-0.5 py-1 text-center transition-all ${
                            isPassed
                              ? 'text-success'
                              : 'text-text-subtle'
                          }`}
                        >
                          <div className="text-[9px] font-mono truncate">{tc.label}</div>
                          <div className="text-[10px] font-bold mt-0.5">
                            {isPassed ? '✓ PASS' : tc.hidden ? '🔒 HIDDEN' : 'READY'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* OVERLAY: INTERVIEW REPORT (Stage 4) */}
              {showPromo && (
                <div className="absolute inset-4 rounded-xl bg-surface/95 border border-rank-gold/40 backdrop-blur-xl shadow-2xl p-5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300 z-30">
                  <div className="w-12 h-12 rounded-full bg-rank-gold/15 border border-rank-gold/30 flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-rank-gold" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-rank-gold font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Technical Interview Complete
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">Your detailed report is ready</h3>
                  <p className="text-xs text-text-muted max-w-sm mb-3">
                    Review your problem-solving approach, communication, and test results.
                  </p>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-success-subtle text-success border border-success/30 font-semibold">
                      Test Results Saved
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-accent-subtle text-accent border border-accent/30 font-semibold">
                      Rank Progress Updated
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPANION FLOATING IPHONE MOCKUP ON BOTTOM RIGHT */}
      <div className="hidden sm:block absolute -bottom-10 -right-6 w-44 rounded-3xl p-2 bg-gradient-to-b from-border/30 via-border/10 to-transparent shadow-xl backdrop-blur-2xl border border-border animate-float-medium z-20">
        <div className="w-full rounded-2xl bg-surface p-3 text-center border border-border">
          {/* Dynamic Island */}
          <div className="w-14 h-3 bg-black rounded-full mx-auto mb-3 border border-white/10" />

          <div className="relative w-10 h-10 rounded-full overflow-hidden mx-auto mb-1 ring-1 ring-accent">
            <Image
              src="/avatars/shubhra.jpg"
              alt="Shubhra"
              fill
              className="object-cover"
            />
          </div>
          <div className="text-[11px] font-semibold text-text-primary">Shubhra</div>
          <div className="text-[9px] text-text-muted font-mono mb-2">Behavioral HR</div>

          <div className="p-1.5 rounded-lg bg-bg border border-border text-[9px] font-mono text-success">
            STAR Method Active
          </div>
        </div>
      </div>
    </div>
  );
}
