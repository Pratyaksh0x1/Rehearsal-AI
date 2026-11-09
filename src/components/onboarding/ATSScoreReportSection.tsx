'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Check } from 'lucide-react';

interface ATSScoreReportSectionProps {
  score?: number;
  topChanges?: string[];
  onContinue: () => void;
}

export function ATSScoreReportSection({
  score = 97,
  topChanges = [],
  onContinue,
}: ATSScoreReportSectionProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Count up from 0 to score
    const target = score || 97;
    const duration = 1200;
    const steps = 40;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setAnimatedScore(target);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [score]);

  // The 10 ATS Checks matching Screenshot 3
  const checks = [
    { label: 'Standard sections', value: 100, color: 'bg-emerald-400' },
    { label: 'Contact details', value: 100, color: 'bg-emerald-400' },
    { label: 'Bullet points', value: 100, color: 'bg-emerald-400' },
    { label: 'Measured results', value: 95, color: 'bg-emerald-400' },
    { label: 'Action verbs', value: 100, color: 'bg-emerald-400' },
    { label: 'Bullet length', value: 92, color: 'bg-emerald-400' },
    { label: 'Skills listed', value: 100, color: 'bg-emerald-400' },
    { label: 'SDE keywords', value: 80, color: 'bg-amber-400' }, // Yellow/amber in screenshot!
    { label: 'Resume length', value: 100, color: 'bg-emerald-400' },
    { label: 'Dates', value: 100, color: 'bg-emerald-400' },
  ];

  const scoreLabel = score >= 90 ? 'Strong' : score >= 75 ? 'Good' : 'Needs Polish';
  const scoreColor = score >= 90 ? 'text-emerald-400' : score >= 75 ? 'text-amber-400' : 'text-orange-400';
  const ringColor = score >= 90 ? '#34d399' : score >= 75 ? '#fbbf24' : '#fb923c';

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 sm:py-12 flex flex-col items-center">
      {/* Top Header matching Screenshot 3 */}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-center text-white mb-10 tracking-tight">
        Here&apos;s how an <span className="italic font-normal text-amber-300">ATS</span> reads it
      </h2>

      {/* 3-Column Grid matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-10 items-stretch">
        {/* ================================================================= */}
        {/* COLUMN 1: Circular Gauge Score (4 Cols)                           */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 rounded-3xl bg-[#161212]/90 border border-amber-900/30 p-6 sm:p-7 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center my-3">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Foreground Animated Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke={ringColor}
                  strokeWidth="8"
                  strokeDasharray={452}
                  strokeDashoffset={452 - (452 * animatedScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Inside Gauge Text */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-5xl font-serif font-black text-white leading-none">
                  {animatedScore}
                </span>
                <span className={`text-base font-bold mt-1 tracking-wide ${scoreColor}`}>
                  {scoreLabel}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono text-amber-200/60 mt-1 block">
              out of 100
            </span>
          </div>

          <p className="text-xs text-amber-100/70 leading-relaxed font-normal text-center mt-6 pt-4 border-t border-amber-900/20">
            How cleanly an applicant-tracking system can read your resume, and how strong its bullet points look. Our own measure: every company&apos;s ATS reads a little differently.
          </p>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 2: What to fix (4 Cols)                                    */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 rounded-3xl bg-[#161212]/90 border border-amber-900/30 p-6 sm:p-7 flex flex-col shadow-2xl backdrop-blur-xl">
          <h3 className="font-serif text-lg font-bold text-white mb-6">
            What to fix
          </h3>

          <div className="space-y-4 flex-1">
            {topChanges && topChanges.length > 0 ? (
              topChanges.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-xs text-amber-100/85 leading-relaxed font-normal">
                    {change}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-200/90 leading-relaxed font-medium">
                  Nothing to fix: every check passed. Your interview is where it gets tested.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* COLUMN 3: The ten checks (4 Cols) matching Screenshot 3           */}
        {/* ================================================================= */}
        <div className="lg:col-span-4 rounded-3xl bg-[#161212]/90 border border-amber-900/30 p-6 sm:p-7 flex flex-col justify-between shadow-2xl backdrop-blur-xl">
          <h3 className="font-serif text-lg font-bold text-white mb-4">
            The ten checks
          </h3>

          <div className="space-y-2.5">
            {checks.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-amber-100/80 font-normal truncate">
                  {item.label}
                </span>

                {/* Progress bar pill */}
                <div className="w-24 sm:w-28 h-1.5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-700 shadow-sm`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* Bottom Subtext & Continue Button matching Screenshot 3            */}
      {/* ================================================================= */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-amber-200/60 font-mono text-center">
          You can update your resume any time from your profile, and see this again.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="px-9 py-3 rounded-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-bold text-sm shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.7)] transition-all flex items-center gap-2 active:scale-95 group cursor-pointer"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}
