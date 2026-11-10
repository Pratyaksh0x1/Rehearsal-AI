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
      {/* Top Header */}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-extrabold text-center text-text-primary mb-10 tracking-tight">
        Here&apos;s how an <span className="italic font-normal text-warning">ATS</span> reads it
      </h2>

      {/* 3-Column Grid matching Screenshot 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full mb-10 items-stretch">
        {/* ================================================================= */}
        {/* COLUMN 1: Circular Gauge Score (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* SVG Circular Progress Ring */}
            <div className="relative w-44 h-44 flex items-center justify-center my-3">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle
                  cx="88"
                  cy="88"
                  r="72"
                  stroke="var(--color-surface-hover)"
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
                <span className="text-5xl font-bold text-text-primary leading-none">
                  {animatedScore}
                </span>
                <span className={`text-base font-bold mt-1 tracking-wide ${scoreColor}`}>
                  {scoreLabel}
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-medium text-text-muted mt-1 block">
              out of 100
            </span>
          </div>

          <p className="text-xs text-text-muted leading-relaxed font-normal text-center mt-6 pt-4 border-t border-border">
            How cleanly an applicant-tracking system can read your resume, and how strong its bullet points look. Our own measure: every company&apos;s ATS reads a little differently.
          </p>
        </div>

        {/* COLUMN 2: What to fix (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-6">
            What to fix
          </h3>

          <div className="space-y-4 flex-1">
            {topChanges && topChanges.length > 0 ? (
              topChanges.map((change, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-accent-subtle text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-xs text-text-muted leading-relaxed font-normal">
                    {change}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-success-subtle border border-success/30">
                <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                <p className="text-xs text-success leading-relaxed font-medium">
                  Nothing to fix: every check passed. Your interview is where it gets tested.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 3: The ten checks (4 Cols) */}
        <div className="lg:col-span-4 rounded-2xl bg-surface border border-border p-6 sm:p-7 flex flex-col justify-between shadow-sm">
          <h3 className="text-lg font-bold text-text-primary mb-4">
            The ten checks
          </h3>

          <div className="space-y-2.5">
            {checks.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-text-muted font-normal truncate">
                  {item.label}
                </span>

                {/* Progress bar pill */}
                <div className="w-24 sm:w-28 h-1.5 rounded-full bg-surface-hover overflow-hidden flex-shrink-0 border border-border">
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

      {/* Bottom Subtext & Continue Button */}
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-text-muted font-medium text-center">
          You can update your resume any time from your profile, and see this again.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="px-9 py-3 rounded-lg bg-accent hover:bg-accent-hover text-accent-foreground font-semibold text-sm shadow-sm transition-all flex items-center gap-2 active:scale-95 group cursor-pointer focus-ring"
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

