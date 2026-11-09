'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';

interface ResumeRadarScanAnimationProps {
  onComplete: () => void;
  fileName?: string;
}

const PHASES = [
  { id: 1, label: 'Opening your PDF', minPct: 0, maxPct: 25 },
  { id: 2, label: 'Sorting it into sections', minPct: 26, maxPct: 52 },
  { id: 3, label: "Checking it's a resume", minPct: 53, maxPct: 78 },
  { id: 4, label: 'Scoring it like an ATS', minPct: 79, maxPct: 100 },
];

export function ResumeRadarScanAnimation({
  onComplete,
}: ResumeRadarScanAnimationProps) {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    // Smoothly progress percentage from 0 to 100% over ~4.8 seconds
    const duration = 4800; // ms
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(100, Math.floor((elapsed / duration) * 100));
      setPercent(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete();
        }, 500);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Determine current active phase
  const currentPhaseIndex = percent < 26 ? 0 : percent < 53 ? 1 : percent < 79 ? 2 : 3;
  const currentPhase = PHASES[currentPhaseIndex];

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center justify-center text-center">
      {/* Top Header matching Screenshot 2 */}
      <div className="flex items-center gap-2 mb-8">
        <h2 className="text-xl sm:text-2xl font-serif text-amber-100 font-medium tracking-wide">
          Navya is reading your resume
        </h2>
        <span className="flex items-center gap-1.5 pt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
        </span>
      </div>

      {/* ================================================================= */}
      {/* Central Radar Scanner Animation matching Screenshot 2              */}
      {/* ================================================================= */}
      <div className="relative w-80 h-80 sm:w-96 sm:h-96 flex items-center justify-center mb-6">
        {/* Radar Circular Background Grid with concentric rings */}
        <div className="absolute inset-0 rounded-full border border-amber-900/30 bg-[#120e0e]/80 shadow-[0_0_60px_rgba(0,0,0,0.8)]" />
        <div className="absolute w-3/4 h-3/4 rounded-full border border-amber-900/40 border-dashed" />
        <div className="absolute w-1/2 h-1/2 rounded-full border border-amber-900/30" />
        <div className="absolute w-1/4 h-1/4 rounded-full border border-amber-900/20" />

        {/* Degree ticks around outer perimeter */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <div
            key={deg}
            className="absolute w-full h-full pointer-events-none"
            style={{ transform: `rotate(${deg}deg)` }}
          >
            <div className="w-2.5 h-0.5 bg-amber-700/50 mx-auto" />
          </div>
        ))}

        {/* Radar Sweeping Beam (rotating gradient light cone) */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(245, 158, 11, 0.08) 320deg, rgba(251, 191, 36, 0.4) 360deg)',
              animation: 'spin 3s linear infinite',
            }}
          />
        </div>

        {/* Orbit track with glowing satellite point particle */}
        <div className="absolute w-[85%] h-[85%] rounded-full border border-amber-500/20 pointer-events-none animate-spin" style={{ animationDuration: '6s' }}>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_12px_rgba(251,191,36,1)]" />
        </div>

        {/* Floating section badges around radar matching Screenshot 2 */}
        {/* Education (top-left) */}
        <div
          className={`absolute -left-2 sm:left-4 top-1/4 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 shadow-md ${
            percent >= 25
              ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
              : 'bg-black/60 border border-white/10 text-white/50'
          }`}
        >
          Education
        </div>

        {/* Projects (top) */}
        <div
          className={`absolute top-2 left-1/3 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 shadow-md ${
            percent >= 50
              ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
              : 'bg-black/60 border border-white/10 text-white/50'
          }`}
        >
          Projects
        </div>

        {/* Skills (right) */}
        <div
          className={`absolute -right-2 sm:right-6 top-1/3 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 shadow-md ${
            percent >= 75
              ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
              : 'bg-black/60 border border-white/10 text-white/50'
          }`}
        >
          Skills
        </div>

        {/* Experience (bottom-left) */}
        <div
          className={`absolute left-8 bottom-12 px-3 py-1 rounded-full text-xs font-mono transition-all duration-300 shadow-md ${
            percent >= 85
              ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
              : 'bg-black/60 border border-white/10 text-white/50'
          }`}
        >
          Experience
        </div>

        {/* Center Stacked Resume Document Sheets matching Screenshot 2 */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Back card 1 */}
          <div className="absolute w-36 h-48 sm:w-44 sm:h-56 rounded-2xl bg-[#1e1717] border border-amber-900/30 -rotate-6 transform scale-95 opacity-50" />
          {/* Back card 2 */}
          <div className="absolute w-36 h-48 sm:w-44 sm:h-56 rounded-2xl bg-[#261c1c] border border-amber-800/40 rotate-6 transform scale-95 opacity-70" />

          {/* Front Active Resume Card */}
          <div className="relative w-36 h-48 sm:w-44 sm:h-56 rounded-2xl bg-[#1f1818] border border-amber-500/50 shadow-2xl p-4 flex flex-col justify-between overflow-hidden">
            {/* Header simulated bars */}
            <div className="space-y-2">
              <div className="w-16 h-2 rounded-full bg-white/90" />
              <div className="w-24 h-1.5 rounded-full bg-amber-400/80" />
              <div className="w-full h-1 rounded-full bg-white/20 mt-3" />
              <div className="w-4/5 h-1 rounded-full bg-white/20" />
              <div className="w-3/4 h-1 rounded-full bg-white/20" />

              <div className="w-14 h-1.5 rounded-full bg-amber-400/80 mt-3" />
              <div className="w-full h-1 rounded-full bg-white/20" />
              <div className="w-5/6 h-1 rounded-full bg-white/20" />
            </div>

            {/* Glowing Orange/Amber Laser Scanner Line moving up and down */}
            <div
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_rgba(251,191,36,1)]"
              style={{
                animation: 'radarScanLine 2s ease-in-out infinite alternate',
              }}
            />
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Percentage Counter & Current Phase matching Screenshot 2          */}
      {/* ================================================================= */}
      <div className="space-y-1 mb-8">
        <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-tight drop-shadow-md">
          {percent}%
        </div>
        <div className="text-sm sm:text-base font-serif text-amber-200/90 tracking-wide">
          {currentPhase.label}
        </div>
      </div>

      {/* ================================================================= */}
      {/* Bottom 4 Progress Pills matching Screenshot 2                     */}
      {/* ================================================================= */}
      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 max-w-2xl">
        {PHASES.map((p, idx) => {
          const isDone = percent > p.maxPct;
          const isActive = percent >= p.minPct && percent <= p.maxPct;

          return (
            <div
              key={p.id}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-300 border ${
                isActive
                  ? 'bg-amber-500/15 border-amber-400 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.25)] font-bold'
                  : isDone
                    ? 'bg-[#1a1414] border-amber-900/60 text-amber-300/80'
                    : 'bg-[#120e0e] border-white/5 text-white/30'
              }`}
            >
              {isDone ? (
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              ) : isActive ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-white/20" />
              )}
              <span>{p.label}</span>
            </div>
          );
        })}
      </div>

      {/* Inline styles for custom scan line keyframes */}
      <style jsx>{`
        @keyframes radarScanLine {
          0% {
            top: 5%;
          }
          100% {
            top: 90%;
          }
        }
      `}</style>
    </div>
  );
}
