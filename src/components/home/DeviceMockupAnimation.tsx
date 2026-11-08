'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Mic,
  Video,
  CheckCircle2,
  Trophy,
  Sparkles,
  Volume2,
  Terminal,
  Zap,
  Shield,
  Activity,
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

export function DeviceMockupAnimation() {
  const [stage, setStage] = useState<1 | 2 | 3 | 4>(1);
  const [typedLines, setTypedLines] = useState<string[]>([]);
  const [testsPassed, setTestsPassed] = useState<number>(0);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Stage timeline cycle: 14 seconds total loop
    const runCycle = () => {
      // Stage 1: 0 - 3.5s (Agent Voice Greeting & Question Presentation)
      setStage(1);
      setTypedLines([]);
      setTestsPassed(0);
      setShowPromo(false);

      // Transition to Stage 2: 3.5s - 7.5s (Code Typing)
      timer = setTimeout(() => {
        setStage(2);
        // Animate code lines typing sequentially
        CODE_LINES.forEach((line, index) => {
          setTimeout(() => {
            setTypedLines((prev) => [...prev, line]);
          }, index * 420);
        });

        // Transition to Stage 3: 7.5s - 10.5s (Test Execution)
        timer = setTimeout(() => {
          setStage(3);
          for (let i = 1; i <= 5; i++) {
            setTimeout(() => {
              setTestsPassed(i);
            }, i * 380);
          }

          // Transition to Stage 4: 10.5s - 14s (Rank Up Modal)
          timer = setTimeout(() => {
            setStage(4);
            setShowPromo(true);

            // Loop back after 3.5s in Stage 4
            timer = setTimeout(() => {
              runCycle();
            }, 3500);
          }, 3000);
        }, 4000);
      }, 3500);
    };

    runCycle();

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-5xl mx-auto py-6 px-2 sm:px-4">
      {/* Background Floating Luxury Glow Orbs (Moving at different speeds) */}
      <div className="absolute -top-12 -left-12 w-80 h-80 bg-accent/20 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute top-1/2 -right-16 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none animate-float-medium" />
      <div className="absolute -bottom-10 left-1/4 w-72 h-72 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none animate-float-fast" />

      {/* Floating Pill Badge 1 (Slow float) */}
      <div className="hidden lg:flex items-center gap-2.5 absolute -top-4 -left-6 z-20 px-3.5 py-1.5 rounded-full glass-pill animate-float-slow">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-xs font-mono font-medium text-emerald-300">
          Gnani.ai &bull; 120ms Voice Latency
        </span>
      </div>

      {/* Floating Pill Badge 2 (Fast float) */}
      <div className="hidden lg:flex items-center gap-2 absolute top-24 -right-8 z-20 px-3.5 py-1.5 rounded-full glass-pill animate-float-fast">
        <Shield className="w-3.5 h-3.5 text-accent" />
        <span className="text-xs font-medium text-text-primary">
          5 Test Cases (3 Visible + 2 Hidden)
        </span>
      </div>

      {/* Floating Pill Badge 3 (Medium float) */}
      <div className="hidden lg:flex items-center gap-2 absolute -bottom-6 left-12 z-20 px-3.5 py-1.5 rounded-full glass-pill animate-float-medium">
        <Trophy className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-medium text-amber-200">
          Dual PUBG Leagues (Tech &amp; HR)
        </span>
      </div>

      {/* MAIN IMAC / MACBOOK PRO DISPLAY FRAME */}
      <div className="relative rounded-2xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        <div className="rounded-xl overflow-hidden bg-[#090d16] border border-white/10">
          {/* macOS Title Bar */}
          <div className="h-10 bg-[#0e1422] border-b border-white/10 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm" />
              <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-sm" />
              <span className="ml-3 text-xs font-mono text-text-muted flex items-center gap-1.5">
                <Terminal className="w-3 h-3 text-accent" />
                rehearsal-ai &mdash; technical-session.py
              </span>
            </div>

            {/* Session Status Pill */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                STAGE {stage}/4: {stage === 1 ? 'AI SPEAKING' : stage === 2 ? 'CODING' : stage === 3 ? 'TESTING' : 'RANK UP'}
              </div>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-text-subtle font-mono">
                <Video className="w-3 h-3 text-emerald-400" />
                <Mic className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>

          {/* INNER INTERACTIVE SCREEN CONTENT */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] sm:min-h-[460px] bg-[#070b12]">
            {/* Left 5 Cols: Interviewer Panel & Spoken Audio Waveform */}
            <div className="md:col-span-5 p-4 sm:p-5 border-b md:border-b-0 md:border-r border-white/10 flex flex-col justify-between bg-gradient-to-b from-[#0c1220]/90 to-[#070b12]/90">
              {/* Agent Profile & Live Status */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative w-13 h-13 rounded-full overflow-hidden ring-2 ring-accent/60 shadow-lg">
                    <Image
                      src="/avatars/kaveri.jpg"
                      alt="Kaveri - Lead Algorithms Specialist"
                      fill
                      className="object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-black" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-text-primary">Kaveri</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-accent/20 text-accent font-mono">Gnani.ai</span>
                    </div>
                    <p className="text-xs text-text-muted">Lead Algorithms Specialist &bull; Technical</p>
                  </div>
                </div>

                {/* Question Prompt Box */}
                <div className="rounded-xl p-3.5 bg-white/5 border border-white/10 shadow-inner">
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
                <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20">
                  <div className="flex items-center gap-2 mb-2 text-xs font-mono text-accent">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{stage === 1 ? 'Interviewer Speaking (No barge-in)...' : 'Candidate Audio Monitored'}</span>
                  </div>

                  {/* Pulsing Voice Waves */}
                  <div className="flex items-center justify-center gap-1 h-8">
                    {[16, 28, 42, 60, 34, 48, 70, 24, 52, 38, 64, 30, 20].map((h, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          stage === 1
                            ? 'bg-accent animate-pulse'
                            : 'bg-emerald-400/60'
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

              {/* Live Proctoring & WebCam Mini Preview */}
              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-surface border border-white/15 flex items-center justify-center text-[10px] font-mono text-text-muted relative overflow-hidden">
                    <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-text-primary flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Proctoring Active
                    </div>
                    <div className="text-[10px] text-text-subtle">Screen &amp; Audio Synced</div>
                  </div>
                </div>
                <div className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-0.5 rounded">
                  03:42 REMAINING
                </div>
              </div>
            </div>

            {/* Right 7 Cols: Interactive IDE, Test Cases, & Rank Promotion Modal */}
            <div className="md:col-span-7 p-4 sm:p-5 flex flex-col justify-between bg-[#080d17] relative">
              {/* Code Editor Header */}
              <div>
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10 text-xs font-mono text-text-muted">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400">●</span>
                    <span className="text-text-primary font-medium">solution.py</span>
                    <span className="text-text-subtle">&bull; Python 3.11</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-text-muted">UTF-8</span>
                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-text-muted">Spaces: 4</span>
                  </div>
                </div>

                {/* Animated Code Typing Area */}
                <div className="font-mono text-xs text-slate-300 leading-relaxed bg-[#05080f] p-3.5 rounded-xl border border-white/5 shadow-inner min-h-[170px]">
                  {typedLines.length === 0 && stage === 1 && (
                    <div className="text-slate-600 italic">
                      # AI Interviewer is introducing the problem...<br />
                      # Candidate code editor will unlock in a moment.
                    </div>
                  )}

                  {typedLines.map((line, idx) => (
                    <div key={idx} className="flex">
                      <span className="w-6 text-slate-600 select-none text-right pr-3">{idx + 1}</span>
                      <span className={
                        line.startsWith('def')
                          ? 'text-cyan-400 font-semibold'
                          : line.includes('return')
                          ? 'text-purple-400 font-medium'
                          : line.includes('for ')
                          ? 'text-amber-300'
                          : 'text-slate-200'
                      }>
                        {line}
                      </span>
                    </div>
                  ))}

                  {stage === 2 && (
                    <div className="flex items-center mt-1">
                      <span className="w-6 text-slate-600 select-none text-right pr-3">{typedLines.length + 1}</span>
                      <span className="w-2 h-4 bg-accent animate-pulse inline-block" />
                    </div>
                  )}
                </div>

                {/* Test Runner Suite Bar */}
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Test Execution Engine</span>
                    </div>
                    <span className="text-[11px] font-mono text-text-muted">
                      {stage >= 3 ? `${testsPassed}/5 Passed` : '5 Total Cases'}
                    </span>
                  </div>

                  {/* 5 Test Case Badges (3 visible, 2 hidden) */}
                  <div className="grid grid-cols-5 gap-1.5">
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
                          className={`p-1.5 rounded-lg border text-center transition-all ${
                            isPassed
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-white/5 border-white/10 text-text-subtle'
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

              {/* OVERLAY: PROMOTION MODAL (Stage 4) */}
              {showPromo && (
                <div className="absolute inset-4 rounded-xl bg-gradient-to-br from-[#0c1322]/95 via-[#0f172a]/95 to-[#0b0f19]/95 border border-amber-400/40 backdrop-blur-xl shadow-2xl p-5 flex flex-col items-center justify-center text-center animate-in fade-in zoom-in-95 duration-300 z-30">
                  <div className="w-12 h-12 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center mb-3">
                    <Trophy className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-400 font-bold mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Rank Promotion Achieved!
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-1">
                    Gold IV &rarr; <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Platinum I</span>
                  </h3>
                  <p className="text-xs text-text-muted max-w-sm mb-3">
                    All 5/5 test cases passed with O(N) linear time complexity. Excellent communication under no-barge-in voice.
                  </p>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      +85 Technical LP
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Score: 96/100
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COMPANION FLOATING IPHONE MOCKUP ON BOTTOM RIGHT */}
      <div className="hidden sm:block absolute -bottom-10 -right-6 w-44 rounded-3xl p-2 bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl border border-white/15 animate-float-medium z-20">
        <div className="w-full rounded-2xl bg-[#090d16] p-3 text-center border border-white/10">
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

          <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-mono text-emerald-400">
            STAR Method Active
          </div>
        </div>
      </div>
    </div>
  );
}

